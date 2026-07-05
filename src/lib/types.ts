export type ListingIntent = "rent" | "lease" | "buy";

export type City = "Lagos" | "Abuja" | "Port Harcourt";

export type ApartmentType = "flat" | "maisonette" | "duplex" | "penthouse";
export type FloorLevel = "Ground" | "1st" | "2nd" | "3rd+";
export type EstateRequirement = "required" | "preferred" | "no-preference";
export type RoadConditionRequirement = "excellent-only" | "fair-acceptable" | "no-preference";
export type FurnishedPreference = "furnished" | "unfurnished" | "either";
export type MoveInTimeline = "immediately" | "within-1-month" | "within-3-months";
export type AgencyPreference = "direct-landlord" | "mandate-agent" | "either";

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

  // Preferences (soft — inform scoring/display, never a hard exclusion)
  apartmentType?: ApartmentType;
  furnishedPreference?: FurnishedPreference;
  commute?: string; // where the client works most often, informational only
  moveInTimeline?: MoveInTimeline;
  agencyPreference?: AgencyPreference;

  // Dealbreakers (hard — excludes a listing outright, but only when the
  // listing actually states the relevant field; see isShortlistEligible)
  maxFloor?: FloorLevel | "no-limit";
  estateRequirement?: EstateRequirement;
  minParkingSpaces: number; // 0 = no requirement
  roadConditionRequirement: RoadConditionRequirement;
  avoidFloodProne: boolean;
  avoidNoisyAreas: boolean;
  requirePrepaidMeter: boolean;
  maxUnitsInCompound?: number;
  maxBuildingAgeYears?: number;
}

export interface ListingSource {
  site: "PropertyPro" | "NigeriaPropertyCentre" | "Jiji" | "Hutbay" | "Manual";
  url: string;
  scrapedAt: string; // ISO timestamp — doubles as the last-verified freshness check
}

// The person authorized to let/sell the property (owner or mandated agent) —
// required for a listing to be shortlist-eligible, so an agent can always
// reach the right person to arrange a viewing.
export interface MandateContact {
  name: string;
  phone: string;
  email?: string;
}

// One-time fees on top of rent, common in the Nigerian rental market — used
// to compute a total move-in cost. All optional: only set when a listing
// (or whoever added it) actually states them, never guessed.
export interface FeeBreakdown {
  agencyFee?: number;
  agreementFee?: number;
  legalFee?: number;
  cautionFee?: number;
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
  mandateContact?: MandateContact;
  feeBreakdown?: FeeBreakdown;
  furnished?: boolean;
  parkingSpaces?: number;
  floor?: FloorLevel;
  postedAt?: string; // when the listing was originally posted, distinct from source.scrapedAt
  apartmentType?: ApartmentType;
  roadCondition?: "excellent" | "fair" | "poor";
  floodProne?: boolean;
  noiseLevel?: "quiet" | "moderate" | "noisy";
  hasPrepaidMeter?: boolean;
  unitsInCompound?: number;
  buildingAgeYears?: number;
}

export interface NeighborhoodSignal {
  neighborhood: string;
  city: City;
  summary: string; // unverified, public-data-derived description
  isVerified: false; // always false until Phase 2 field verification exists
}

// An agent's own real assessment of a listing — never AI-generated (see
// CLAUDE.md: don't claim unverified accuracy). Only ever set by a human.
export type AgentRating = "excellent" | "good" | "fair" | "avoid";

export interface ShortlistItem {
  listing: Listing;
  matchScore: number; // 0-100
  matchReasons: string[];
  neighborhoodSignal?: NeighborhoodSignal;
  addedByClient?: boolean; // client-picked, bypasses the eligibility gate entirely
  agentRating?: AgentRating;
  // Dealbreakers the client stated but this listing has no data for — not
  // excluded (we won't penalize a listing for a field nobody filled in),
  // but flagged so the agent knows to verify before recommending it.
  unconfirmedDealbreakers?: string[];
}

export interface ClientContact {
  name: string;
  phone: string;
  email?: string;
}

export interface Shortlist {
  id: string;
  criteria: SearchCriteria;
  items: ShortlistItem[];
  createdAt: string;
  agentNotes?: string;
  clientContact?: ClientContact;
  submittedToAgentAt?: string;
}
