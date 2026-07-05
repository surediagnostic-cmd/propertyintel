import { NextResponse } from "next/server";
import { z } from "zod";
import { previewListingFromUrl } from "@/lib/scraping/importListing";

export const maxDuration = 30;

const bodySchema = z.object({
  url: z.string().url(),
  city: z.enum(["Lagos", "Abuja", "Port Harcourt"]),
  intent: z.enum(["rent", "lease", "buy"]),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { url, city, intent } = parsed.data;
  const preview = await previewListingFromUrl(url, city, intent);
  return NextResponse.json(preview);
}
