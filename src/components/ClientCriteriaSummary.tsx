import type { SearchCriteria } from "@/lib/types";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

const MOVE_IN_LABEL: Record<NonNullable<SearchCriteria["moveInTimeline"]>, string> = {
  immediately: "immediately",
  "within-1-month": "within 1 month",
  "within-3-months": "within 3 months",
};

const AGENCY_PREFERENCE_LABEL: Record<NonNullable<SearchCriteria["agencyPreference"]>, string> = {
  "direct-landlord": "prefers direct landlord",
  "mandate-agent": "prefers mandate agent",
  either: "no preference on landlord vs. agent",
};

export function ClientCriteriaSummary({ criteria }: { criteria: SearchCriteria }) {
  const dealbreakers = [
    criteria.minParkingSpaces > 0 && `${criteria.minParkingSpaces}+ parking`,
    criteria.avoidFloodProne && "no flood-prone areas",
    criteria.avoidNoisyAreas && "no noisy areas",
    criteria.requirePrepaidMeter && "must have prepaid meter",
    criteria.roadConditionRequirement === "excellent-only" && "excellent roads only",
    criteria.maxUnitsInCompound !== undefined && `max ${criteria.maxUnitsInCompound} flats in compound`,
    criteria.maxBuildingAgeYears !== undefined && `max ${criteria.maxBuildingAgeYears}yr old building`,
    criteria.maxFloor && criteria.maxFloor !== "no-limit" && `max floor: ${criteria.maxFloor}`,
    criteria.estateRequirement === "required" && "gated estate required",
  ].filter(Boolean);

  const preferences = [
    criteria.apartmentType,
    criteria.furnishedPreference && criteria.furnishedPreference !== "either" && criteria.furnishedPreference,
    criteria.estateRequirement === "preferred" && "gated estate preferred",
    criteria.moveInTimeline && `move in ${MOVE_IN_LABEL[criteria.moveInTimeline]}`,
    criteria.agencyPreference && criteria.agencyPreference !== "either" && AGENCY_PREFERENCE_LABEL[criteria.agencyPreference],
    criteria.commute && `commutes to ${criteria.commute}`,
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 dark:bg-neutral-900">
      <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">Client&apos;s picks</p>
      <p className="mt-2 text-sm">
        {criteria.intent} in {criteria.city} · {formatNaira(criteria.minBudget)}–{formatNaira(criteria.maxBudget)} ·{" "}
        {criteria.bedrooms} bed / {criteria.bathrooms} bath
        {criteria.neighborhoods.length > 0 && <> · {criteria.neighborhoods.join(", ")}</>}
      </p>

      {criteria.mustHaveAmenities.length > 0 && (
        <p className="mt-2 text-sm">
          <span className="font-medium">Must-haves: </span>
          {criteria.mustHaveAmenities.join(", ")}
        </p>
      )}

      {dealbreakers.length > 0 && (
        <p className="mt-2 text-sm text-red-700">
          <span className="font-medium">Dealbreakers: </span>
          {dealbreakers.join(" · ")}
        </p>
      )}

      {preferences.length > 0 && (
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          <span className="font-medium">Also prefers: </span>
          {preferences.join(" · ")}
        </p>
      )}

      {criteria.notes && (
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          <span className="font-medium">In their own words: </span>
          {criteria.notes}
        </p>
      )}
    </div>
  );
}
