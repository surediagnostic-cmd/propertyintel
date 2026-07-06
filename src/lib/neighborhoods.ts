import type { City } from "@/lib/types";

// An area with sub-areas is shown as one chip that expands to reveal its
// sub-areas (only those get added to the search) — keeps areas with many
// sub-divisions (like Surulere) from flooding the picker with 15+ buttons.
// An area with no subAreas is selectable directly, same as before.
export interface NeighborhoodArea {
  name: string;
  subAreas?: string[];
}

export const NEIGHBORHOODS_BY_CITY: Record<City, NeighborhoodArea[]> = {
  Lagos: [
    { name: "Lekki Phase 1" },
    { name: "Chevron" },
    { name: "Magodo" },
    { name: "Gbagada" },
    {
      name: "Surulere",
      subAreas: [
        "Bode Thomas, Surulere",
        "Adeniran Ogunsanya, Surulere",
        "Adelabu, Surulere",
        "Aguda, Surulere",
        "Eric Moore, Surulere",
        "Iponri, Surulere",
        "Lawanson, Surulere",
        "Ojuelegba, Surulere",
        "Masha, Surulere",
        "Akerele, Surulere",
        "Census, Surulere",
        "Itire, Surulere",
        "Cole Street, Surulere",
        "Randle Avenue, Surulere",
        "Surulere (anywhere)",
      ],
    },
  ],
  Abuja: [{ name: "Maitama" }, { name: "Guzape" }, { name: "Wuse 2" }],
  "Port Harcourt": [{ name: "GRA Phase 2" }, { name: "Old GRA" }, { name: "Trans Amadi" }],
};

export const AMENITY_OPTIONS = [
  "24hr power",
  "water treatment",
  "borehole",
  "generator",
  "inverter",
  "solar",
  "gated estate",
  "swimming pool",
  "gym",
  "bq",
  "ensuite rooms",
  "fitted kitchen",
  "pop ceiling",
  "balcony",
  "walk-in closet",
  "elevator",
  "cctv",
  "security guards",
  "children's play area",
];
