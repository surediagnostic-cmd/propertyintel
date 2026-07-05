export type ListingIntent = "rent" | "lease" | "buy";

export type City = "Lagos" | "Abuja" | "Port Harcourt";

export interface SearchCriteria {
  intent: ListingIntent;
  city: City;
  neighborhoods: string[]; // e.g. ["Lekki Phase 1", "Chevron"], empty = any
  minBudget: number; // NGN
  maxBudget: number; // NGN
  bedrooms: number;
  bathrooms: number;
  mustHaveAmenities: string[]; // e.g. ["water treatment", "generator", "24hr power"]
  notes?: string; // raw free-text from conversational intake, kept for the agent
}

export interface ListingSource {
  site: "PropertyPro" | "NigeriaPropertyCentre" | "Jiji" | "Hutbay" | "Manual";
  url: string;
  scrapedAt: string; // ISO timestamp
}

export interface Listing {
  id: string;
  title: string;
  intent: ListingIntent;
  city: City;
  neighborhood: string;
  price: number; // NGN, annualized for rent/lease, sale price for buy
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  photos: string[];
  source: ListingSource;
}

export interface NeighborhoodSignal {
  neighborhood: string;
  city: City;
  summary: string; // unverified, public-data-derived description
  isVerified: false; // always false until Phase 2 field verification exists
}

export interface ShortlistItem {
  listing: Listing;
  matchScore: number; // 0-100
  matchReasons: string[];
  neighborhoodSignal?: NeighborhoodSignal;
}

export interface Shortlist {
  id: string;
  criteria: SearchCriteria;
  items: ShortlistItem[];
  createdAt: string;
  agentNotes?: string;
}
