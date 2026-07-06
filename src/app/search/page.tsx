"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AgencyPreference,
  ApartmentType,
  City,
  EstateRequirement,
  FloorLevel,
  FurnishedPreference,
  ListingIntent,
  MoveInTimeline,
  RoadConditionRequirement,
} from "@/lib/types";
import { AMENITY_OPTIONS, NEIGHBORHOODS_BY_CITY } from "@/lib/neighborhoods";

export default function SearchPage() {
  const router = useRouter();
  const [intent, setIntent] = useState<ListingIntent>("rent");
  const [city, setCity] = useState<City>("Lagos");
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [minBudget, setMinBudget] = useState(1_000_000);
  const [maxBudget, setMaxBudget] = useState(10_000_000);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [apartmentType, setApartmentType] = useState<ApartmentType | "">("");
  const [maxFloor, setMaxFloor] = useState<FloorLevel | "no-limit">("no-limit");
  const [furnishedPreference, setFurnishedPreference] = useState<FurnishedPreference>("either");
  const [estateRequirement, setEstateRequirement] = useState<EstateRequirement>("no-preference");

  const [minParkingSpaces, setMinParkingSpaces] = useState(0);
  const [roadConditionRequirement, setRoadConditionRequirement] = useState<RoadConditionRequirement>("no-preference");
  const [avoidFloodProne, setAvoidFloodProne] = useState(false);
  const [avoidNoisyAreas, setAvoidNoisyAreas] = useState(false);
  const [requirePrepaidMeter, setRequirePrepaidMeter] = useState(false);
  const [maxUnitsInCompound, setMaxUnitsInCompound] = useState<number | "">("");
  const [maxBuildingAgeYears, setMaxBuildingAgeYears] = useState<number | "">("");

  const [commute, setCommute] = useState("");
  const [moveInTimeline, setMoveInTimeline] = useState<MoveInTimeline>("within-1-month");
  const [agencyPreference, setAgencyPreference] = useState<AgencyPreference>("either");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableNeighborhoods = useMemo(() => NEIGHBORHOODS_BY_CITY[city], [city]);

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          city,
          neighborhoods,
          minBudget,
          maxBudget,
          bedrooms,
          bathrooms,
          mustHaveAmenities: amenities,
          notes: notes || undefined,
          apartmentType: apartmentType || undefined,
          maxFloor,
          furnishedPreference,
          estateRequirement,
          minParkingSpaces,
          roadConditionRequirement,
          avoidFloodProne,
          avoidNoisyAreas,
          requirePrepaidMeter,
          maxUnitsInCompound: maxUnitsInCompound === "" ? undefined : maxUnitsInCompound,
          maxBuildingAgeYears: maxBuildingAgeYears === "" ? undefined : maxBuildingAgeYears,
          commute: commute || undefined,
          moveInTimeline,
          agencyPreference,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.formErrors?.join(", ") || data.error || "Something went wrong");
        return;
      }
      router.push(`/results/${data.shortlistId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Find your top 5–7 matches</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Tell us what you want. We&apos;ll shortlist the best-fit listings and a PropertyIntel Agent
        can turn this into a full recommendation.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">I want to</span>
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value as ListingIntent)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            >
              <option value="rent">Rent</option>
              <option value="lease">Lease</option>
              <option value="buy">Buy</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">City</span>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value as City);
                setNeighborhoods([]);
                setExpandedArea(null);
              }}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            >
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja</option>
              <option value="Port Harcourt">Port Harcourt</option>
            </select>
          </label>
        </div>

        <div>
          <span className="text-sm font-medium">Preferred neighborhoods (optional)</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableNeighborhoods.map((area) => {
              if (!area.subAreas) {
                return (
                  <button
                    type="button"
                    key={area.name}
                    onClick={() => toggle(neighborhoods, setNeighborhoods, area.name)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      neighborhoods.includes(area.name)
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300"
                    }`}
                  >
                    {area.name}
                  </button>
                );
              }

              const selectedCount = area.subAreas.filter((s) => neighborhoods.includes(s)).length;
              const isExpanded = expandedArea === area.name;
              return (
                <button
                  type="button"
                  key={area.name}
                  onClick={() => setExpandedArea(isExpanded ? null : area.name)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    selectedCount > 0 || isExpanded
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300"
                  }`}
                >
                  {area.name} {selectedCount > 0 && `(${selectedCount})`} {isExpanded ? "▲" : "▼"}
                </button>
              );
            })}
          </div>

          {expandedArea && (
            <div className="mt-2 flex flex-wrap gap-2 rounded-lg border border-neutral-200 p-3">
              {availableNeighborhoods
                .find((area) => area.name === expandedArea)
                ?.subAreas?.map((sub) => (
                  <button
                    type="button"
                    key={sub}
                    onClick={() => toggle(neighborhoods, setNeighborhoods, sub)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      neighborhoods.includes(sub)
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300"
                    }`}
                  >
                    {sub.replace(`, ${expandedArea}`, "")}
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Min budget (₦)</span>
            <input
              type="number"
              value={minBudget}
              onChange={(e) => setMinBudget(Number(e.target.value))}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              min={0}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Max budget (₦)</span>
            <input
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              min={0}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Bedrooms</span>
            <input
              type="number"
              value={bedrooms}
              onChange={(e) => setBedrooms(Number(e.target.value))}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              min={0}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Bathrooms</span>
            <input
              type="number"
              value={bathrooms}
              onChange={(e) => setBathrooms(Number(e.target.value))}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              min={0}
            />
          </label>
        </div>

        <div>
          <span className="text-sm font-medium">Must-have amenities (optional)</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => toggle(amenities, setAmenities, a)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  amenities.includes(a) ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-sm font-medium">Property preferences</p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm">Apartment type</span>
              <select
                value={apartmentType}
                onChange={(e) => setApartmentType(e.target.value as ApartmentType | "")}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              >
                <option value="">Doesn&apos;t matter</option>
                <option value="flat">Flat</option>
                <option value="maisonette">Maisonette</option>
                <option value="duplex">Duplex</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm">Maximum floor</span>
              <select
                value={maxFloor}
                onChange={(e) => setMaxFloor(e.target.value as FloorLevel | "no-limit")}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              >
                <option value="no-limit">No limit</option>
                <option value="Ground">Ground floor</option>
                <option value="1st">1st floor</option>
                <option value="2nd">2nd floor</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm">Furnished?</span>
              <select
                value={furnishedPreference}
                onChange={(e) => setFurnishedPreference(e.target.value as FurnishedPreference)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              >
                <option value="either">Either</option>
                <option value="furnished">Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm">Is an estate compulsory?</span>
              <select
                value={estateRequirement}
                onChange={(e) => setEstateRequirement(e.target.value as EstateRequirement)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              >
                <option value="no-preference">No preference</option>
                <option value="preferred">Prefer estate, not compulsory</option>
                <option value="required">Yes, compulsory</option>
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-neutral-900">
          <p className="text-sm font-medium">Dealbreakers</p>
          <p className="text-xs text-neutral-500">
            Listings that fail these are excluded outright — but only when the listing actually
            states that detail; we&apos;ll flag it for the agent to confirm otherwise.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm">Minimum parking spaces</span>
              <input
                type="number"
                value={minParkingSpaces}
                onChange={(e) => setMinParkingSpaces(Number(e.target.value))}
                min={0}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm">Road condition</span>
              <select
                value={roadConditionRequirement}
                onChange={(e) => setRoadConditionRequirement(e.target.value as RoadConditionRequirement)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              >
                <option value="no-preference">Doesn&apos;t matter</option>
                <option value="fair-acceptable">Fair road acceptable</option>
                <option value="excellent-only">Excellent road only</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm">Max flats in compound (optional)</span>
              <input
                type="number"
                value={maxUnitsInCompound}
                onChange={(e) => setMaxUnitsInCompound(e.target.value === "" ? "" : Number(e.target.value))}
                min={1}
                placeholder="No limit"
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm">Max building age, years (optional)</span>
              <input
                type="number"
                value={maxBuildingAgeYears}
                onChange={(e) => setMaxBuildingAgeYears(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
                placeholder="No limit"
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={avoidFloodProne} onChange={(e) => setAvoidFloodProne(e.target.checked)} />
              Avoid flood-prone areas
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={avoidNoisyAreas} onChange={(e) => setAvoidNoisyAreas(e.target.checked)} />
              Avoid noisy areas
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={requirePrepaidMeter}
                onChange={(e) => setRequirePrepaidMeter(e.target.checked)}
              />
              Must have a prepaid meter
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-sm font-medium">Other details</p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm">Where do you work most often?</span>
              <input
                type="text"
                value={commute}
                onChange={(e) => setCommute(e.target.value)}
                placeholder="Helps us think about commute"
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm">Move-in date</span>
              <select
                value={moveInTimeline}
                onChange={(e) => setMoveInTimeline(e.target.value as MoveInTimeline)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              >
                <option value="immediately">Immediately</option>
                <option value="within-1-month">Within one month</option>
                <option value="within-3-months">Within three months</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm">Agency preference</span>
              <select
                value={agencyPreference}
                onChange={(e) => setAgencyPreference(e.target.value as AgencyPreference)}
                className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
              >
                <option value="either">Either</option>
                <option value="direct-landlord">Direct landlord only</option>
                <option value="mandate-agent">Mandate agents only</option>
              </select>
            </label>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Anything else? Describe it in your own words (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            placeholder="e.g. Close to a good primary school, quiet street, landlord who allows pets..."
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-neutral-900 px-4 py-3 text-white disabled:opacity-50"
        >
          {submitting ? "Searching..." : "Find my top matches"}
        </button>
      </form>
    </main>
  );
}
