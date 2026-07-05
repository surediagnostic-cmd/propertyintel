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
  furnished: z.boolean().optional(),
  parkingSpaces: z.number().int().min(0).optional(),
  floor: z.enum(["Ground", "1st", "2nd", "3rd+"]).optional(),
  apartmentType: z.enum(["flat", "maisonette", "duplex", "penthouse"]).optional(),
  roadCondition: z.enum(["excellent", "fair", "poor"]).optional(),
  floodProne: z.boolean().optional(),
  noiseLevel: z.enum(["quiet", "moderate", "noisy"]).optional(),
  hasPrepaidMeter: z.boolean().optional(),
  unitsInCompound: z.number().int().min(1).optional(),
  buildingAgeYears: z.number().int().min(0).optional(),
  agencyFee: z.number().min(0).optional(),
  agreementFee: z.number().min(0).optional(),
  legalFee: z.number().min(0).optional(),
  cautionFee: z.number().min(0).optional(),
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
    furnished: data.furnished,
    parkingSpaces: data.parkingSpaces,
    floor: data.floor,
    apartmentType: data.apartmentType,
    roadCondition: data.roadCondition,
    floodProne: data.floodProne,
    noiseLevel: data.noiseLevel,
    hasPrepaidMeter: data.hasPrepaidMeter,
    unitsInCompound: data.unitsInCompound,
    buildingAgeYears: data.buildingAgeYears,
    feeBreakdown:
      data.agencyFee || data.agreementFee || data.legalFee || data.cautionFee
        ? {
            agencyFee: data.agencyFee,
            agreementFee: data.agreementFee,
            legalFee: data.legalFee,
            cautionFee: data.cautionFee,
          }
        : undefined,
  });

  return NextResponse.json({ ok: true });
}
