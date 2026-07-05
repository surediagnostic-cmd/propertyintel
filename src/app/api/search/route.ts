import { NextResponse } from "next/server";
import { z } from "zod";
import { buildShortlist } from "@/lib/matching/score";
import { propertyProAdapter } from "@/lib/scraping/propertyProAdapter";
import { createShortlist } from "@/lib/shortlistRepo";
import { getStoredListings } from "@/lib/listingsRepo";

// The live PropertyPro scrape does several sequential, rate-limited fetches
// (see propertyProAdapter's DETAIL_FETCH_DELAY_MS) which can run past
// Vercel's default serverless timeout.
export const maxDuration = 60;

const criteriaSchema = z.object({
  intent: z.enum(["rent", "lease", "buy"]),
  city: z.enum(["Lagos", "Abuja", "Port Harcourt"]),
  neighborhoods: z.array(z.string()).default([]),
  minBudget: z.number().min(0),
  maxBudget: z.number().min(0),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  mustHaveAmenities: z.array(z.string()).default([]),
  notes: z.string().optional(),
  apartmentType: z.enum(["flat", "maisonette", "duplex", "penthouse"]).optional(),
  furnishedPreference: z.enum(["furnished", "unfurnished", "either"]).default("either"),
  commute: z.string().optional(),
  moveInTimeline: z.enum(["immediately", "within-1-month", "within-3-months"]).default("within-1-month"),
  agencyPreference: z.enum(["direct-landlord", "mandate-agent", "either"]).default("either"),
  maxFloor: z.enum(["Ground", "1st", "2nd", "no-limit"]).default("no-limit"),
  estateRequirement: z.enum(["required", "preferred", "no-preference"]).default("no-preference"),
  minParkingSpaces: z.number().int().min(0).default(0),
  roadConditionRequirement: z.enum(["excellent-only", "fair-acceptable", "no-preference"]).default("no-preference"),
  avoidFloodProne: z.boolean().default(false),
  avoidNoisyAreas: z.boolean().default(false),
  requirePrepaidMeter: z.boolean().default(false),
  maxUnitsInCompound: z.number().int().min(1).optional(),
  maxBuildingAgeYears: z.number().int().min(0).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = criteriaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const criteria = parsed.data;

  if (criteria.minBudget > criteria.maxBudget) {
    return NextResponse.json({ error: "minBudget cannot exceed maxBudget" }, { status: 400 });
  }

  // Two sources, merged: whatever's already been curated/imported into our
  // own listings table (see /agent/add-listing), plus a best-effort live
  // scrape attempt. The live scrape currently returns [] in production —
  // PropertyPro's infra blocks Vercel's IP ranges (see propertyProAdapter.ts)
  // — but it's left in so this starts working again the moment that's no
  // longer true, with no code change needed here.
  const [stored, live] = await Promise.all([
    getStoredListings(criteria.city, criteria.intent),
    propertyProAdapter.fetchListings({ city: criteria.city, intent: criteria.intent }),
  ]);
  const seen = new Set<string>();
  const listings = [...stored, ...live].filter((l) => (seen.has(l.source.url) ? false : (seen.add(l.source.url), true)));

  const items = buildShortlist(listings, criteria);

  if (items.length === 0) {
    return NextResponse.json(
      {
        error:
          "No eligible listings found for this city/intent yet. An agent may need to add one via /agent/add-listing, or try a different city/intent.",
      },
      { status: 404 },
    );
  }

  const shortlistId = await createShortlist(criteria, items);
  return NextResponse.json({ shortlistId });
}
