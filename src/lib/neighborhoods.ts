import type { City } from "@/lib/types";

export const NEIGHBORHOODS_BY_CITY: Record<City, string[]> = {
  Lagos: ["Lekki Phase 1", "Chevron", "Magodo", "Gbagada", "Surulere"],
  Abuja: ["Maitama", "Guzape", "Wuse 2"],
  "Port Harcourt": ["GRA Phase 2", "Old GRA", "Trans Amadi"],
};

export const AMENITY_OPTIONS = [
  "24hr power",
  "water treatment",
  "generator",
  "gated estate",
  "swimming pool",
  "bq",
];
