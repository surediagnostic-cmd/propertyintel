import * as cheerio from "cheerio";
import type { City, Listing, ListingIntent, MandateContact } from "@/lib/types";
import type { ListingSourceAdapter } from "./adapter";

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
 */

const USER_AGENT = "PropertyIntelBot/1.0 (+https://propertyintel-rose.vercel.app; contact: yinkadeniran@yahoo.com)";
const BASE_URL = "https://propertypro.ng";
const MAX_CANDIDATES = 12;
const DETAIL_FETCH_DELAY_MS = 350;

const CITY_SLUGS: Record<City, string> = {
  Lagos: "lagos",
  Abuja: "abuja",
  "Port Harcourt": "port-harcourt",
};

const INTENT_SLUGS: Record<ListingIntent, string> = {
  rent: "property-for-rent",
  lease: "property-for-lease",
  buy: "property-for-sale",
};

const KNOWN_AMENITIES = [
  "24hr power",
  "water treatment",
  "generator",
  "gated estate",
  "swimming pool",
  "bq",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url: string): Promise<string | null> {
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

function parsePrice(text: string): number {
  const match = text.replace(/,/g, "").match(/[\d]+/);
  return match ? Number(match[0]) : 0;
}

function parseBedsBaths(text: string): { bedrooms: number; bathrooms: number } {
  const bedMatch = text.match(/(\d+)\s*Bed/i);
  const bathMatch = text.match(/(\d+)\s*Bath/i);
  return {
    bedrooms: bedMatch ? Number(bedMatch[1]) : 0,
    bathrooms: bathMatch ? Number(bathMatch[1]) : 0,
  };
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Parses "Updated 05 Jul 2026, Added 24 Jun 2026" -> the Updated date (more
// recent), falling back to Added if there's no Updated segment.
function parseListedDate(text: string): string {
  const match = text.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (!match) return new Date().toISOString();
  const [, day, monAbbr, year] = match;
  const month = MONTHS[monAbbr.toLowerCase()];
  if (month === undefined) return new Date().toISOString();
  return new Date(Number(year), month, Number(day)).toISOString();
}

function extractAmenities(bodyText: string): string[] {
  const lower = bodyText.toLowerCase();
  return KNOWN_AMENITIES.filter((a) => lower.includes(a));
}

async function fetchMandateContact(detailUrl: string): Promise<{ contact?: MandateContact; amenities: string[] }> {
  const html = await fetchHtml(detailUrl);
  if (!html) return { amenities: [] };

  const phoneMatch = html.match(/href="tel:(\d{6,})"/);
  const $ = cheerio.load(html);
  const agentName = $(".sidebar-block01 h4").first().text().trim();
  const bodyText = $(".des-inner").first().text() || $("body").text();

  if (!phoneMatch || !agentName) return { amenities: extractAmenities(bodyText) };

  return {
    contact: { name: agentName, phone: phoneMatch[1] },
    amenities: extractAmenities(bodyText),
  };
}

export const propertyProAdapter: ListingSourceAdapter = {
  site: "PropertyPro",
  async fetchListings({ city, intent }: { city: City; intent: ListingIntent }): Promise<Listing[]> {
    const url = `${BASE_URL}/${INTENT_SLUGS[intent]}/in/${CITY_SLUGS[city]}`;
    const html = await fetchHtml(url);
    if (!html) return [];

    const $ = cheerio.load(html);
    const candidates: Array<Omit<Listing, "mandateContact" | "amenities"> & { detailUrl: string }> = [];

    $(".property-listing").each((_, el) => {
      if (candidates.length >= MAX_CANDIDATES) return;

      const card = $(el);
      const titleLink = card.find(".pl-title h3 a").first();
      const href = titleLink.attr("href");
      if (!href) return;

      const title = titleLink.text().trim();
      const neighborhood = card.find(".pl-title p").first().text().trim();
      const price = parsePrice(card.find(".pl-price h3").first().text());
      const { bedrooms, bathrooms } = parseBedsBaths(card.find(".pl-price h6").first().text());
      const photo = card.find(".slider-content img").first().attr("data-src");
      const dateText = card.find(".date-added").first().text();
      const detailUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      candidates.push({
        id: detailUrl,
        title,
        intent,
        city,
        neighborhood: neighborhood || city,
        price,
        bedrooms,
        bathrooms,
        photos: photo ? [photo] : [],
        source: { site: "PropertyPro", url: detailUrl, scrapedAt: parseListedDate(dateText) },
        detailUrl,
      });
    });

    const listings: Listing[] = [];
    for (const candidate of candidates) {
      const { contact, amenities } = await fetchMandateContact(candidate.detailUrl);
      const { detailUrl: _detailUrl, ...listing } = candidate;
      listings.push({ ...listing, amenities, mandateContact: contact });
      await sleep(DETAIL_FETCH_DELAY_MS);
    }

    return listings;
  },
};
