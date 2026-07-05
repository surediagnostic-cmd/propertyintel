import { NextResponse } from "next/server";
import { z } from "zod";
import { saveListing } from "@/lib/listingsRepo";
import { inferSourceSite } from "@/lib/scraping/importListing";

const bodySchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  city: z.enum(["Lagos", "Abuja", "Port Harcourt"]),
  intent: z.enum(["rent", "lease", "buy"]),
  neighborhood: z.string().min(1),
  price: z.number().min(0),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
  mandateName: z.string().min(1),
  mandatePhone: z.string().min(1),
  mandateEmail: z.string().email().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  await saveListing({
    id: data.url,
    title: data.title,
    intent: data.intent,
    city: data.city,
    neighborhood: data.neighborhood,
    price: data.price,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    amenities: data.amenities,
    photos: data.photos,
    source: { site: inferSourceSite(data.url), url: data.url, scrapedAt: new Date().toISOString() },
    mandateContact: { name: data.mandateName, phone: data.mandatePhone, email: data.mandateEmail || undefined },
  });

  return NextResponse.json({ ok: true });
}
