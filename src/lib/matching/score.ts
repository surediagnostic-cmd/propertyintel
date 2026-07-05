import type { Listing, SearchCriteria, ShortlistItem } from "@/lib/types";
import { getMockNeighborhoodSignal } from "@/lib/scraping/mockNeighborhoodSignals";

const MIN_SHORTLIST_SIZE = 5;
const MAX_SHORTLIST_SIZE = 7;
const FRESHNESS_WINDOW_HOURS = 72;

/**
 * Hard eligibility gate applied before scoring: a listing only makes the
 * shortlist if it's been verified in the last 72 hours and we have contact
 * details for whoever holds the mandate to let/sell it. Neither of these is
 * a scoring factor — listings that fail either check are excluded outright.
 */
export function isShortlistEligible(listing: Listing, now: Date = new Date()): boolean {
  const scrapedAt = new Date(listing.source.scrapedAt).getTime();
  const ageHours = (now.getTime() - scrapedAt) / (1000 * 60 * 60);
  const isFresh = ageHours >= 0 && ageHours <= FRESHNESS_WINDOW_HOURS;

  const contact = listing.mandateContact;
  const hasMandateContact = Boolean(contact && contact.name.trim() && contact.phone.trim());

  return isFresh && hasMandateContact;
}

/**
 * Scores a single listing against a client's criteria on a 0-100 scale.
 * Weights: budget fit > neighborhood match > bedrooms/bathrooms > amenities.
 * Listings outside the budget range are still scored (never excluded outright)
 * so the shortlist can fall back to "closest fit" when nothing matches exactly.
 */
export function scoreListing(listing: Listing, criteria: SearchCriteria): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Budget fit: 40 points, tapering off the further outside the range.
  const { minBudget, maxBudget } = criteria;
  if (listing.price >= minBudget && listing.price <= maxBudget) {
    score += 40;
    reasons.push("Within budget");
  } else {
    const distance = listing.price < minBudget ? minBudget - listing.price : listing.price - maxBudget;
    const budgetSpan = Math.max(maxBudget - minBudget, maxBudget * 0.1, 1);
    const penalty = Math.min(1, distance / budgetSpan);
    score += 40 * (1 - penalty);
    if (penalty < 1) reasons.push("Close to budget");
  }

  // Neighborhood match: 25 points. No preference = full credit for any neighborhood in the city.
  if (criteria.neighborhoods.length === 0 || criteria.neighborhoods.includes(listing.neighborhood)) {
    score += 25;
    if (criteria.neighborhoods.includes(listing.neighborhood)) reasons.push(`Matches preferred area: ${listing.neighborhood}`);
  } else {
    score += 10; // same city, different area — still somewhat relevant
  }

  // Bedrooms/bathrooms: 20 points, scaled by how close the counts are.
  const bedroomDiff = Math.abs(listing.bedrooms - criteria.bedrooms);
  const bathroomDiff = Math.abs(listing.bathrooms - criteria.bathrooms);
  const roomScore = Math.max(0, 20 - (bedroomDiff * 6 + bathroomDiff * 4));
  score += roomScore;
  if (listing.bedrooms >= criteria.bedrooms) reasons.push(`${listing.bedrooms} bedrooms`);

  // Amenities: 15 points, proportional to how many must-haves are covered.
  if (criteria.mustHaveAmenities.length > 0) {
    const covered = criteria.mustHaveAmenities.filter((a) => listing.amenities.includes(a));
    score += 15 * (covered.length / criteria.mustHaveAmenities.length);
    if (covered.length > 0) reasons.push(`Has: ${covered.join(", ")}`);
  } else {
    score += 15;
  }

  return { score: Math.round(Math.max(0, Math.min(100, score))), reasons };
}

/**
 * Ranks listings against criteria and returns the top 5-7 (fewer only if the
 * whole inventory is smaller than 5).
 */
export function buildShortlist(listings: Listing[], criteria: SearchCriteria): ShortlistItem[] {
  const ranked = listings
    .filter((listing) => isShortlistEligible(listing))
    .map((listing) => {
      const { score, reasons } = scoreListing(listing, criteria);
      return {
        listing,
        matchScore: score,
        matchReasons: reasons,
        neighborhoodSignal: getMockNeighborhoodSignal(listing.city, listing.neighborhood),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  const size = Math.min(MAX_SHORTLIST_SIZE, Math.max(MIN_SHORTLIST_SIZE, ranked.length));
  return ranked.slice(0, Math.min(size, ranked.length));
}
