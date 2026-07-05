import { randomUUID } from "crypto";
import type { ClientContact, Listing, SearchCriteria, Shortlist, ShortlistItem } from "@/lib/types";
import { getMockNeighborhoodSignal } from "@/lib/scraping/mockNeighborhoodSignals";
import { scoreListing } from "@/lib/matching/score";
import { getServerSupabase } from "@/lib/supabase/server";
import { memoryStore } from "@/lib/store/memoryStore";
import { listingToRow, rowToListing } from "@/lib/listingsRepo";

/**
 * Persists a search + its generated shortlist to Supabase when configured,
 * falling back to the in-memory dev store otherwise. Callers never need to
 * know which backend is active.
 */
export async function createShortlist(criteria: SearchCriteria, items: ShortlistItem[]): Promise<string> {
  const supabase = getServerSupabase();

  if (!supabase) {
    const shortlist: Shortlist = {
      id: randomUUID(),
      criteria,
      items,
      createdAt: new Date().toISOString(),
    };
    memoryStore.saveShortlist(shortlist);
    return shortlist.id;
  }

  const { data: search, error: searchError } = await supabase
    .from("searches")
    .insert({
      intent: criteria.intent,
      city: criteria.city,
      neighborhoods: criteria.neighborhoods,
      min_budget: criteria.minBudget,
      max_budget: criteria.maxBudget,
      bedrooms: criteria.bedrooms,
      bathrooms: criteria.bathrooms,
      must_have_amenities: criteria.mustHaveAmenities,
      notes: criteria.notes,
    })
    .select("id")
    .single();
  if (searchError) throw searchError;

  const { data: shortlistRow, error: shortlistError } = await supabase
    .from("shortlists")
    .insert({ search_id: search.id })
    .select("id")
    .single();
  if (shortlistError) throw shortlistError;

  for (const [rank, item] of items.entries()) {
    const { data: listingRow, error: listingError } = await supabase
      .from("listings")
      .upsert(listingToRow(item.listing), { onConflict: "source_url" })
      .select("id")
      .single();
    if (listingError) throw listingError;

    const { error: itemError } = await supabase.from("shortlist_items").insert({
      shortlist_id: shortlistRow.id,
      listing_id: listingRow.id,
      match_score: item.matchScore,
      match_reasons: item.matchReasons,
      rank: rank + 1,
    });
    if (itemError) throw itemError;
  }

  return shortlistRow.id;
}

export async function getShortlist(id: string): Promise<Shortlist | undefined> {
  const supabase = getServerSupabase();
  if (!supabase) return memoryStore.getShortlist(id);

  const { data: shortlistRow, error: shortlistError } = await supabase
    .from("shortlists")
    .select("id, agent_notes, created_at, submitted_to_agent_at, search_id, searches(*)")
    .eq("id", id)
    .single();
  if (shortlistError || !shortlistRow) return undefined;

  const { data: itemRows, error: itemsError } = await supabase
    .from("shortlist_items")
    .select("match_score, match_reasons, rank, added_by_client, listings(*)")
    .eq("shortlist_id", id)
    .order("rank", { ascending: true });
  if (itemsError) throw itemsError;

  const search = Array.isArray(shortlistRow.searches) ? shortlistRow.searches[0] : shortlistRow.searches;

  const criteria: SearchCriteria = {
    intent: search.intent,
    city: search.city,
    neighborhoods: search.neighborhoods ?? [],
    minBudget: search.min_budget,
    maxBudget: search.max_budget,
    bedrooms: search.bedrooms,
    bathrooms: search.bathrooms,
    mustHaveAmenities: search.must_have_amenities ?? [],
    notes: search.notes ?? undefined,
  };

  const items: ShortlistItem[] = (itemRows ?? []).map((row) => {
    const listingRow = Array.isArray(row.listings) ? row.listings[0] : row.listings;
    const listing = rowToListing(listingRow);
    return {
      listing,
      matchScore: row.match_score,
      matchReasons: row.match_reasons ?? [],
      neighborhoodSignal: getMockNeighborhoodSignal(listing.city, listing.neighborhood),
      addedByClient: row.added_by_client ?? false,
    };
  });

  return {
    id: shortlistRow.id,
    criteria,
    items,
    createdAt: shortlistRow.created_at,
    agentNotes: shortlistRow.agent_notes ?? undefined,
    clientContact: search.client_name
      ? { name: search.client_name, phone: search.client_phone, email: search.client_email ?? undefined }
      : undefined,
    submittedToAgentAt: shortlistRow.submitted_to_agent_at ?? undefined,
  };
}

export async function listShortlists(): Promise<Shortlist[]> {
  const supabase = getServerSupabase();
  if (!supabase) return memoryStore.listShortlists();

  const { data: rows, error } = await supabase
    .from("shortlists")
    .select("id")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const shortlists = await Promise.all((rows ?? []).map((row) => getShortlist(row.id)));
  return shortlists.filter((s): s is Shortlist => Boolean(s));
}

export async function updateAgentNotes(id: string, notes: string): Promise<void> {
  const supabase = getServerSupabase();
  if (!supabase) {
    memoryStore.updateAgentNotes(id, notes);
    return;
  }
  const { error } = await supabase.from("shortlists").update({ agent_notes: notes }).eq("id", id);
  if (error) throw error;
}

/** Consumer -> agent handoff: records who to follow up with and when they asked for review. */
export async function sendToAgent(shortlistId: string, contact: ClientContact): Promise<void> {
  const now = new Date().toISOString();
  const supabase = getServerSupabase();

  if (!supabase) {
    memoryStore.sendToAgent(shortlistId, contact, now);
    return;
  }

  const { data: shortlistRow, error: shortlistError } = await supabase
    .from("shortlists")
    .select("search_id")
    .eq("id", shortlistId)
    .single();
  if (shortlistError || !shortlistRow) throw shortlistError ?? new Error("Shortlist not found");

  const { error: searchError } = await supabase
    .from("searches")
    .update({ client_name: contact.name, client_phone: contact.phone, client_email: contact.email ?? null })
    .eq("id", shortlistRow.search_id);
  if (searchError) throw searchError;

  const { error: updateError } = await supabase
    .from("shortlists")
    .update({ submitted_to_agent_at: now })
    .eq("id", shortlistId);
  if (updateError) throw updateError;
}

/**
 * A client adding a listing they found themselves to their own shortlist —
 * deliberately bypasses isShortlistEligible (the 72h/mandate-contact gate):
 * the client is vouching for this one directly, not asking the matching
 * engine to find it.
 */
export async function addShortlistItem(shortlistId: string, listing: Listing): Promise<void> {
  const shortlist = await getShortlist(shortlistId);
  if (!shortlist) throw new Error("Shortlist not found");

  const { score, reasons } = scoreListing(listing, shortlist.criteria);
  const nextRank = shortlist.items.length + 1;

  const supabase = getServerSupabase();
  if (!supabase) {
    memoryStore.addShortlistItem(shortlistId, {
      listing,
      matchScore: score,
      matchReasons: reasons,
      addedByClient: true,
    });
    return;
  }

  const { data: listingRow, error: listingError } = await supabase
    .from("listings")
    .upsert(listingToRow(listing), { onConflict: "source_url" })
    .select("id")
    .single();
  if (listingError) throw listingError;

  const { error: itemError } = await supabase.from("shortlist_items").insert({
    shortlist_id: shortlistId,
    listing_id: listingRow.id,
    match_score: score,
    match_reasons: reasons,
    rank: nextRank,
    added_by_client: true,
  });
  if (itemError) throw itemError;
}
