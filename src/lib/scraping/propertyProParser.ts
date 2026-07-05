import * as cheerio from "cheerio";
import type { City, Listing, ListingIntent, MandateContact } from "@/lib/types";

export const BASE_URL = "https://propertypro.ng";

export const CITY_SLUGS: Record<City, string> = {
  Lagos: "lagos",
  Abuja: "abuja",
  "Port Harcourt": "port-harcourt",
};

export const INTENT_SLUGS: Record<ListingIntent, string> = {
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

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export function parsePrice(text: string): number {
  const match = text.replace(/,/g, "").match(/[\d]+/);
  return match ? Number(match[0]) : 0;
}

export function parseBedsBaths(text: string): { bedrooms: number; bathrooms: number } {
  const bedMatch = text.match(/(\d+)\s*Bed/i);
  const bathMatch = text.match(/(\d+)\s*Bath/i);
  return {
    bedrooms: bedMatch ? Number(bedMatch[1]) : 0,
    bathrooms: bathMatch ? Number(bathMatch[1]) : 0,
  };
}

// Parses the search-card's "Updated 05 Jul 2026, Added 24 Jun 2026" -> the
// Updated date (more recent), falling back to Added if there's no Updated.
export function parseCardDate(text: string): string | undefined {
  const match = text.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (!match) return undefined;
  const [, day, monAbbr, year] = match;
  const month = MONTHS[monAbbr.toLowerCase()];
  if (month === undefined) return undefined;
  return new Date(Number(year), month, Number(day)).toISOString();
}

// Parses the detail page's precise "Last updated 2026-06-29 08:01:41.0".
export function parseLastUpdated(text: string): string | undefined {
  const match = text.match(/Last updated\s+([\d-]{10})[ T]([\d:]{5,8})/);
  if (!match) return undefined;
  const iso = new Date(`${match[1]}T${match[2]}`);
  return Number.isNaN(iso.getTime()) ? undefined : iso.toISOString();
}

export function extractAmenities(text: string): string[] {
  const lower = text.toLowerCase();
  return KNOWN_AMENITIES.filter((a) => lower.includes(a));
}

export interface SearchCandidate {
  title: string;
  neighborhood: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  photo?: string;
  listedAt?: string;
  detailUrl: string;
}

export function parseSearchResultsPage(html: string, max: number): SearchCandidate[] {
  const $ = cheerio.load(html);
  const candidates: SearchCandidate[] = [];

  $(".property-listing").each((_, el) => {
    if (candidates.length >= max) return;

    const card = $(el);
    const titleLink = card.find(".pl-title h3 a").first();
    const href = titleLink.attr("href");
    if (!href) return;

    const detailUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
    candidates.push({
      title: titleLink.text().trim(),
      neighborhood: card.find(".pl-title p").first().text().trim(),
      price: parsePrice(card.find(".pl-price h3").first().text()),
      ...parseBedsBaths(card.find(".pl-price h6").first().text()),
      photo: card.find(".slider-content img").first().attr("data-src"),
      listedAt: parseCardDate(card.find(".date-added").first().text()),
      detailUrl,
    });
  });

  return candidates;
}

export interface DetailPageData {
  title?: string;
  neighborhood?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  photos: string[];
  amenities: string[];
  mandateContact?: MandateContact;
  listedAt?: string;
}

export function parseDetailPage(html: string): DetailPageData {
  const $ = cheerio.load(html);

  const title = $(".page-heading").first().text().trim() || undefined;
  const neighborhood = $("p:has(i.fa-location-dot)").first().text().trim() || undefined;
  const priceText = $(".property-pricing .pricing h2").first().text();
  const price = priceText.trim() ? parsePrice(priceText) : undefined;
  const specsText = $(".property-pros").first().text();
  const { bedrooms, bathrooms } = parseBedsBaths(specsText);

  const photos = $(".slider-content img, .thumbslider-container img")
    .map((_, img) => $(img).attr("data-src") || $(img).attr("src"))
    .get()
    .filter((src): src is string => Boolean(src && !src.startsWith("data:")));

  const descriptionText = $(".des-inner").first().text();
  const amenities = extractAmenities(descriptionText || $("body").text());

  const phoneMatch = html.match(/href="tel:(\d{6,})"/);
  const agentName = $(".sidebar-block01 h4").first().text().trim();
  const mandateContact: MandateContact | undefined =
    phoneMatch && agentName ? { name: agentName, phone: phoneMatch[1] } : undefined;

  const addressBlockText = $("h6:contains('Last updated')").first().text();
  const listedAt = parseLastUpdated(addressBlockText || $("body").text());

  return {
    title,
    neighborhood,
    price,
    bedrooms: bedrooms || undefined,
    bathrooms: bathrooms || undefined,
    photos,
    amenities,
    mandateContact,
    listedAt,
  };
}

export function candidateAndDetailToListing(
  candidate: SearchCandidate,
  detail: DetailPageData,
  city: City,
  intent: ListingIntent,
): Listing {
  return {
    id: candidate.detailUrl,
    title: detail.title || candidate.title,
    intent,
    city,
    neighborhood: detail.neighborhood || candidate.neighborhood || city,
    price: detail.price ?? candidate.price,
    bedrooms: detail.bedrooms ?? candidate.bedrooms,
    bathrooms: detail.bathrooms ?? candidate.bathrooms,
    amenities: detail.amenities,
    photos: detail.photos.length > 0 ? detail.photos : candidate.photo ? [candidate.photo] : [],
    source: {
      site: "PropertyPro",
      url: candidate.detailUrl,
      scrapedAt: detail.listedAt || candidate.listedAt || new Date().toISOString(),
    },
    mandateContact: detail.mandateContact,
  };
}
