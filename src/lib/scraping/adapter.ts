import type { City, Listing, ListingIntent } from "@/lib/types";

/**
 * One adapter per source site. Real scraping is deferred per CLAUDE.md until
 * each site's ToS/robots.txt has been reviewed — for now every adapter must
 * return data honestly sourced (mock data is clearly marked as such) so the
 * matching engine and UI can be built and tested end-to-end.
 */
export interface ListingSourceAdapter {
  site: Listing["source"]["site"];
  fetchListings(filter: { city: City; intent: ListingIntent }): Promise<Listing[]>;
}

export { mockAdapter } from "./mockAdapter";
