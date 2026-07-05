import type { City, Listing, ListingIntent } from "@/lib/types";

/**
 * One adapter per source site. Each adapter is only written after its ToS
 * and robots.txt have been reviewed (see CLAUDE.md and the review notes at
 * the top of propertyProAdapter.ts) — sources that prohibit automated
 * access or block requests outright are dropped rather than worked around.
 */
export interface ListingSourceAdapter {
  site: Listing["source"]["site"];
  fetchListings(filter: { city: City; intent: ListingIntent }): Promise<Listing[]>;
}

export { propertyProAdapter } from "./propertyProAdapter";
