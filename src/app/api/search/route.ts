import { NextResponse } from "next/server";
import { z } from "zod";
import { buildShortlist } from "@/lib/matching/score";
import { propertyProAdapter } from "@/lib/scraping/propertyProAdapter";
import { createShortlist } from "@/lib/shortlistRepo";

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

  const listings = await propertyProAdapter.fetchListings({ city: criteria.city, intent: criteria.intent });
  const items = buildShortlist(listings, criteria);

  if (items.length === 0) {
    return NextResponse.json(
      {
        error:
          "No eligible listings found for this city/intent right now (nothing currently live on PropertyPro matched, or matched but lacked a recent verification/contact). Try a different city or intent.",
      },
      { status: 404 },
    );
  }

  const shortlistId = await createShortlist(criteria, items);
  return NextResponse.json({ shortlistId });
}
