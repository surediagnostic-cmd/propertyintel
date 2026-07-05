import { randomUUID } from "crypto";
import type { Listing, SearchCriteria, Shortlist, ShortlistItem } from "@/lib/types";
import { getMockNeighborhoodSignal } from "@/lib/scraping/mockNeighborhoodSignals";
import { getServerSupabase } from "@/lib/supabase/server";
import { memoryStore } from "@/lib/store/memoryStore";

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
      .upsert(
        {
          title: item.listing.title,
          intent: item.listing.intent,
          city: item.listing.city,
          neighborhood: item.listing.neighborhood,
          price: item.listing.price,
          bedrooms: item.listing.bedrooms,
          bathrooms: item.listing.bathrooms,
          amenities: item.listing.amenities,
          photos: item.listing.photos,
          source_site: item.listing.source.site,
          source_url: item.listing.source.url,
          scraped_at: item.listing.source.scrapedAt,
        },
        { onConflict: "source_url" },
      )
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
    .select("id, agent_notes, created_at, search_id, searches(*)")
    .eq("id", id)
    .single();
  if (shortlistError || !shortlistRow) return undefined;

  const { data: itemRows, error: itemsError } = await supabase
    .from("shortlist_items")
    .select("match_score, match_reasons, rank, listings(*)")
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
    const listing: Listing = {
      id: listingRow.id,
      title: listingRow.title,
      intent: listingRow.intent,
      city: listingRow.city,
      neighborhood: listingRow.neighborhood,
      price: listingRow.price,
      bedrooms: listingRow.bedrooms,
      bathrooms: listingRow.bathrooms,
      amenities: listingRow.amenities ?? [],
      photos: listingRow.photos ?? [],
      source: {
        site: listingRow.source_site,
        url: listingRow.source_url,
        scrapedAt: listingRow.scraped_at,
      },
    };
    return {
      listing,
      matchScore: row.match_score,
      matchReasons: row.match_reasons ?? [],
      neighborhoodSignal: getMockNeighborhoodSignal(listing.city, listing.neighborhood),
    };
  });

  return {
    id: shortlistRow.id,
    criteria,
    items,
    createdAt: shortlistRow.created_at,
    agentNotes: shortlistRow.agent_notes ?? undefined,
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
