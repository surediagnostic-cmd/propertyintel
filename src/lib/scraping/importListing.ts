import type { City, Listing, ListingIntent } from "@/lib/types";
import { fetchHtml } from "./propertyProAdapter";
import { parseDetailPage } from "./propertyProParser";

/**
 * Best-effort single-URL import: an agent pastes a link to a real listing
 * (from PropertyPro or elsewhere) and we try to auto-fill the fields. This
 * is a one-off, human-initiated fetch of a page a person already chose to
 * look at — not bulk automated crawling — but it still only auto-parses
 * PropertyPro (the one source cleared in CLAUDE.md's ToS/robots.txt
 * review). Any other domain, or a PropertyPro fetch that fails (e.g. the
 * same infra-level block documented in propertyProAdapter.ts), just comes
 * back with fetched: false so the agent fills in the fields by hand — the
 * URL is still stored for source attribution either way.
 */

export function inferSourceSite(url: string): Listing["source"]["site"] {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();

  if (host.endsWith("propertypro.ng")) return "PropertyPro";
  if (host.endsWith("nigeriapropertycentre.com")) return "NigeriaPropertyCentre";
  if (host.endsWith("jiji.ng")) return "Jiji";
  if (host.endsWith("hutbay.com")) return "Hutbay";
  return "Manual";
}

export interface ImportPreview {
  fetched: boolean;
  listing: Partial<Listing>;
}

export async function previewListingFromUrl(url: string, city: City, intent: ListingIntent): Promise<ImportPreview> {
  const site = inferSourceSite(url);
  const base: Partial<Listing> = {
    intent,
    city,
    source: { site, url, scrapedAt: new Date().toISOString() },
  };

  if (site !== "PropertyPro") {
    return { fetched: false, listing: base };
  }

  const html = await fetchHtml(url);
  if (!html) {
    return { fetched: false, listing: base };
  }

  const detail = parseDetailPage(html);
  return {
    fetched: true,
    listing: {
      ...base,
      title: detail.title,
      neighborhood: detail.neighborhood,
      price: detail.price,
      bedrooms: detail.bedrooms,
      bathrooms: detail.bathrooms,
      photos: detail.photos,
      amenities: detail.amenities,
      mandateContact: detail.mandateContact,
      source: { site, url, scrapedAt: detail.listedAt || new Date().toISOString() },
    },
  };
}
