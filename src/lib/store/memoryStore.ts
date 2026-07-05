import type { City, ClientContact, Listing, ListingIntent, Shortlist } from "@/lib/types";

/**
 * Dev-only fallback used when Supabase isn't configured yet (see
 * .env.local.example). Resets on every server restart — never rely on this
 * for anything beyond local testing of the golden path.
 *
 * Stashed on `globalThis`: Next.js's dev bundler compiles route handlers and
 * page components into separate module graphs, so a plain module-level Map
 * gets duplicated (API writes and page reads would land in different
 * instances). globalThis is the one thing guaranteed to be shared.
 */
const globalForStore = globalThis as unknown as {
  __propertyIntelShortlists?: Map<string, Shortlist>;
  __propertyIntelListings?: Map<string, Listing>; // keyed by source url
};
const shortlists = globalForStore.__propertyIntelShortlists ?? new Map<string, Shortlist>();
globalForStore.__propertyIntelShortlists = shortlists;
const listings = globalForStore.__propertyIntelListings ?? new Map<string, Listing>();
globalForStore.__propertyIntelListings = listings;

export const memoryStore = {
  saveShortlist(shortlist: Shortlist) {
    shortlists.set(shortlist.id, shortlist);
  },
  getShortlist(id: string): Shortlist | undefined {
    return shortlists.get(id);
  },
  listShortlists(): Shortlist[] {
    return Array.from(shortlists.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  updateAgentNotes(id: string, notes: string) {
    const shortlist = shortlists.get(id);
    if (shortlist) shortlist.agentNotes = notes;
  },
  sendToAgent(id: string, contact: ClientContact, submittedAt: string) {
    const shortlist = shortlists.get(id);
    if (shortlist) {
      shortlist.clientContact = contact;
      shortlist.submittedToAgentAt = submittedAt;
    }
  },
  saveListing(listing: Listing) {
    listings.set(listing.source.url, listing);
  },
  getListings(city: City, intent: ListingIntent): Listing[] {
    return Array.from(listings.values()).filter((l) => l.city === city && l.intent === intent);
  },
};
