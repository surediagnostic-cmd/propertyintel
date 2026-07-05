import type { City, Listing, ListingIntent } from "@/lib/types";
import type { ListingSourceAdapter } from "./adapter";
import {
  BASE_URL,
  CITY_SLUGS,
  INTENT_SLUGS,
  candidateAndDetailToListing,
  parseDetailPage,
  parseSearchResultsPage,
} from "./propertyProParser";

/**
 * Real adapter for propertypro.ng. Reviewed against CLAUDE.md's scraping
 * rules before this was written:
 *  - robots.txt (checked 2026-07) only disallows /admin, /backend, /links,
 *    /thank-you, and a handful of filter query params — none of which this
 *    adapter touches.
 *  - Terms of Use permit reproducing content as long as we attribute
 *    PropertyPro.ng and link back to the source (see ShortlistView, which
 *    always shows "Source: PropertyPro · view original listing").
 *  - We identify ourselves honestly via User-Agent rather than posing as a
 *    browser, and fetch sequentially with a delay — no concurrency, no
 *    bot-detection evasion, no touching disallowed paths.
 *
 * The other three candidate sources (NigeriaPropertyCentre, Jiji, Hutbay)
 * are NOT scraped: NigeriaPropertyCentre's ToS explicitly prohibits
 * automated access, Jiji's "no interference" clause is ambiguous enough to
 * need real legal sign-off first, and Hutbay 403s every request including
 * robots.txt itself.
 *
 * As of 2026-07, PropertyPro's own infrastructure returns HTTP 403 for
 * requests originating from Vercel's IP ranges specifically (confirmed: the
 * identical request succeeds from a non-cloud IP). Per CLAUDE.md, that's a
 * block to respect, not route around — this bulk fetch is left in place for
 * whenever that changes (a partnership, an allow-listed IP, etc.), but the
 * primary listing source in production is the agent-curated import flow in
 * importListing.ts, which reuses this same parser.
 */

export const USER_AGENT = "PropertyIntelBot/1.0 (+https://propertyintel-rose.vercel.app; contact: yinkadeniran@yahoo.com)";
const MAX_CANDIDATES = 12;
const DETAIL_FETCH_DELAY_MS = 350;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      console.error(`[propertyProAdapter] ${url} -> HTTP ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.error(`[propertyProAdapter] fetch failed for ${url}:`, err);
    return null;
  }
}

export const propertyProAdapter: ListingSourceAdapter = {
  site: "PropertyPro",
  async fetchListings({ city, intent }: { city: City; intent: ListingIntent }): Promise<Listing[]> {
    const url = `${BASE_URL}/${INTENT_SLUGS[intent]}/in/${CITY_SLUGS[city]}`;
    const html = await fetchHtml(url);
    if (!html) return [];

    const candidates = parseSearchResultsPage(html, MAX_CANDIDATES);

    const listings: Listing[] = [];
    for (const candidate of candidates) {
      const detailHtml = await fetchHtml(candidate.detailUrl);
      const detail = detailHtml ? parseDetailPage(detailHtml) : { photos: [], amenities: [] };
      listings.push(candidateAndDetailToListing(candidate, detail, city, intent));
      await sleep(DETAIL_FETCH_DELAY_MS);
    }

    return listings;
  },
};
