import type { NeighborhoodSignal } from "@/lib/types";

// Placeholder public-data summaries. Real sources (crime stats, flood maps,
// telecom coverage) are an open question in CLAUDE.md — replace before launch.
const SIGNALS: Omit<NeighborhoodSignal, "isVerified">[] = [
  { city: "Lagos", neighborhood: "Lekki Phase 1", summary: "Established gated estates, good road network, higher flood risk near the waterfront." },
  { city: "Lagos", neighborhood: "Chevron", summary: "Popular with expats and oil & gas workers, reliable estate security, moderate traffic to the island." },
  { city: "Lagos", neighborhood: "Magodo", summary: "Mixed gated/non-gated streets, generally stable power, contested boundary with Ikosi-Isheri in places." },
  { city: "Lagos", neighborhood: "Gbagada", summary: "Central location with fast access to the mainland, some low-lying areas prone to flooding in rainy season." },
  { city: "Lagos", neighborhood: "Surulere", summary: "Dense, older neighborhood, good public transport access, inconsistent power supply." },
  { city: "Abuja", neighborhood: "Maitama", summary: "High-end diplomatic zone, strong infrastructure and security, premium pricing." },
  { city: "Abuja", neighborhood: "Guzape", summary: "Newer upscale development, hilly terrain reduces flood risk, growing amenity base." },
  { city: "Abuja", neighborhood: "Wuse 2", summary: "Central commercial district, good road access, higher traffic and noise levels." },
  { city: "Port Harcourt", neighborhood: "GRA Phase 2", summary: "Traditional high-end residential area, decent security, occasional flooding in low spots." },
  { city: "Port Harcourt", neighborhood: "Old GRA", summary: "Quiet, established streets close to the city center, aging drainage infrastructure." },
  { city: "Port Harcourt", neighborhood: "Trans Amadi", summary: "Mixed industrial/residential area, convenient for commuting to commercial zones, variable power reliability." },
];

export function getMockNeighborhoodSignal(
  city: NeighborhoodSignal["city"],
  neighborhood: string,
): NeighborhoodSignal | undefined {
  const match = SIGNALS.find((s) => s.city === city && s.neighborhood === neighborhood);
  return match ? { ...match, isVerified: false } : undefined;
}
