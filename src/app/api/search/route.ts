import { NextResponse } from "next/server";
import { z } from "zod";
import { buildShortlist } from "@/lib/matching/score";
import { mockAdapter } from "@/lib/scraping/adapter";
import { createShortlist } from "@/lib/shortlistRepo";

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

  // Real scraping is deferred pending per-site ToS review (see CLAUDE.md);
  // this pulls from the mock inventory so the full flow is testable now.
  const listings = await mockAdapter.fetchListings({ city: criteria.city, intent: criteria.intent });
  const items = buildShortlist(listings, criteria);

  if (items.length === 0) {
    return NextResponse.json(
      { error: "No listings found for this city/intent yet. Try a different city or intent." },
      { status: 404 },
    );
  }

  const shortlistId = await createShortlist(criteria, items);
  return NextResponse.json({ shortlistId });
}
