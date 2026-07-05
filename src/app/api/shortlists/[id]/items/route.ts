import { NextResponse } from "next/server";
import { z } from "zod";
import { addShortlistItem, getShortlist } from "@/lib/shortlistRepo";
import { inferSourceSite } from "@/lib/scraping/importListing";

const bodySchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  neighborhood: z.string().min(1),
  price: z.number().min(0),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
  mandateName: z.string().optional(),
  mandatePhone: z.string().optional(),
  mandateEmail: z.string().email().optional().or(z.literal("")),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const shortlist = await getShortlist(id);
  if (!shortlist) {
    return NextResponse.json({ error: "Shortlist not found" }, { status: 404 });
  }

  await addShortlistItem(id, {
    id: data.url,
    title: data.title,
    intent: shortlist.criteria.intent,
    city: shortlist.criteria.city,
    neighborhood: data.neighborhood,
    price: data.price,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    amenities: data.amenities,
    photos: data.photos,
    source: { site: inferSourceSite(data.url), url: data.url, scrapedAt: new Date().toISOString() },
    mandateContact:
      data.mandateName && data.mandatePhone
        ? { name: data.mandateName, phone: data.mandatePhone, email: data.mandateEmail || undefined }
        : undefined,
  });

  return NextResponse.json({ ok: true });
}
