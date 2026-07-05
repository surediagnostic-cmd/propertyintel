"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { City, ListingIntent } from "@/lib/types";
import { AMENITY_OPTIONS, NEIGHBORHOODS_BY_CITY } from "@/lib/neighborhoods";

export default function SearchPage() {
  const router = useRouter();
  const [intent, setIntent] = useState<ListingIntent>("rent");
  const [city, setCity] = useState<City>("Lagos");
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState(1_000_000);
  const [maxBudget, setMaxBudget] = useState(10_000_000);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
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
            {availableNeighborhoods.map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => toggle(neighborhoods, setNeighborhoods, n)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  neighborhoods.includes(n)
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
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
