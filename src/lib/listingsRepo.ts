import type { City, Listing, ListingIntent } from "@/lib/types";
import { getServerSupabase } from "@/lib/supabase/server";
import { memoryStore } from "@/lib/store/memoryStore";

export function listingToRow(listing: Listing) {
  return {
    title: listing.title,
    intent: listing.intent,
    city: listing.city,
    neighborhood: listing.neighborhood,
    price: listing.price,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    amenities: listing.amenities,
    photos: listing.photos,
    source_site: listing.source.site,
    source_url: listing.source.url,
    scraped_at: listing.source.scrapedAt,
    contact_name: listing.mandateContact?.name ?? null,
    contact_phone: listing.mandateContact?.phone ?? null,
    contact_email: listing.mandateContact?.email ?? null,
    agency_fee: listing.feeBreakdown?.agencyFee ?? null,
    agreement_fee: listing.feeBreakdown?.agreementFee ?? null,
    legal_fee: listing.feeBreakdown?.legalFee ?? null,
    caution_fee: listing.feeBreakdown?.cautionFee ?? null,
    furnished: listing.furnished ?? null,
    parking_spaces: listing.parkingSpaces ?? null,
    floor: listing.floor ?? null,
    posted_at: listing.postedAt ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToListing(row: any): Listing {
  return {
    id: row.id,
    title: row.title,
    intent: row.intent,
    city: row.city,
    neighborhood: row.neighborhood,
    price: row.price,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    amenities: row.amenities ?? [],
    photos: row.photos ?? [],
    source: { site: row.source_site, url: row.source_url, scrapedAt: row.scraped_at },
    mandateContact: row.contact_name
      ? { name: row.contact_name, phone: row.contact_phone, email: row.contact_email ?? undefined }
      : undefined,
    feeBreakdown:
      row.agency_fee || row.agreement_fee || row.legal_fee || row.caution_fee
        ? {
            agencyFee: row.agency_fee ?? undefined,
            agreementFee: row.agreement_fee ?? undefined,
            legalFee: row.legal_fee ?? undefined,
            cautionFee: row.caution_fee ?? undefined,
          }
        : undefined,
    furnished: row.furnished ?? undefined,
    parkingSpaces: row.parking_spaces ?? undefined,
    floor: row.floor ?? undefined,
    postedAt: row.posted_at ?? undefined,
  };
}

/** Upserts a single listing (keyed on source_url), used by the agent's manual/URL import flow. */
export async function saveListing(listing: Listing): Promise<void> {
  const supabase = getServerSupabase();
  if (!supabase) {
    memoryStore.saveListing(listing);
    return;
  }
  const { error } = await supabase.from("listings").upsert(listingToRow(listing), { onConflict: "source_url" });
  if (error) throw error;
}

/** Listings available to match a search against — the agent-curated inventory for a city/intent. */
export async function getStoredListings(city: City, intent: ListingIntent): Promise<Listing[]> {
  const supabase = getServerSupabase();
  if (!supabase) return memoryStore.getListings(city, intent);

  const { data, error } = await supabase.from("listings").select("*").eq("city", city).eq("intent", intent);
  if (error) throw error;
  return (data ?? []).map(rowToListing);
}
