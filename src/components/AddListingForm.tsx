"use client";

import { useState } from "react";
import type { ApartmentType, City, FloorLevel, ListingIntent } from "@/lib/types";
import { AMENITY_OPTIONS } from "@/lib/neighborhoods";

export function AddListingForm() {
  const [url, setUrl] = useState("");
  const [city, setCity] = useState<City>("Lagos");
  const [intent, setIntent] = useState<ListingIntent>("rent");

  const [title, setTitle] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [price, setPrice] = useState(0);
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [furnished, setFurnished] = useState(false);
  const [parkingSpaces, setParkingSpaces] = useState(0);
  const [floor, setFloor] = useState<FloorLevel | "">("");
  const [apartmentType, setApartmentType] = useState<ApartmentType | "">("");
  const [roadCondition, setRoadCondition] = useState<"" | "excellent" | "fair" | "poor">("");
  const [floodProne, setFloodProne] = useState<"" | "yes" | "no">("");
  const [noiseLevel, setNoiseLevel] = useState<"" | "quiet" | "moderate" | "noisy">("");
  const [hasPrepaidMeter, setHasPrepaidMeter] = useState<"" | "yes" | "no">("");
  const [unitsInCompound, setUnitsInCompound] = useState<number | "">("");
  const [buildingAgeYears, setBuildingAgeYears] = useState<number | "">("");
  const [agencyFee, setAgencyFee] = useState(0);
  const [agreementFee, setAgreementFee] = useState(0);
  const [legalFee, setLegalFee] = useState(0);
  const [cautionFee, setCautionFee] = useState(0);
  const [mandateName, setMandateName] = useState("");
  const [mandatePhone, setMandatePhone] = useState("");
  const [mandateEmail, setMandateEmail] = useState("");

  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleAmenity(value: string) {
    setAmenities((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function handleFetch() {
    if (!url) return;
    setFetching(true);
    setFetchNote(null);
    setError(null);
    try {
      const res = await fetch("/api/listings/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, city, intent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.formErrors?.join(", ") || "Couldn't preview that link");
        return;
      }
      const { fetched, listing } = data;
      if (fetched) {
        if (listing.title) setTitle(listing.title);
        if (listing.neighborhood) setNeighborhood(listing.neighborhood);
        if (listing.price) setPrice(listing.price);
        if (listing.bedrooms) setBedrooms(listing.bedrooms);
        if (listing.bathrooms) setBathrooms(listing.bathrooms);
        if (listing.amenities?.length) setAmenities(listing.amenities);
        if (listing.mandateContact?.name) setMandateName(listing.mandateContact.name);
        if (listing.mandateContact?.phone) setMandatePhone(listing.mandateContact.phone);
        setFetchNote("Auto-filled from the listing. Double-check before saving.");
      } else {
        setFetchNote("Couldn't auto-fetch this link — fill in the details below yourself.");
      }
    } finally {
      setFetching(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          title,
          city,
          intent,
          neighborhood,
          price,
          bedrooms,
          bathrooms,
          amenities,
          photos: [],
          furnished,
          parkingSpaces,
          floor: floor || undefined,
          apartmentType: apartmentType || undefined,
          roadCondition: roadCondition || undefined,
          floodProne: floodProne === "" ? undefined : floodProne === "yes",
          noiseLevel: noiseLevel || undefined,
          hasPrepaidMeter: hasPrepaidMeter === "" ? undefined : hasPrepaidMeter === "yes",
          unitsInCompound: unitsInCompound === "" ? undefined : unitsInCompound,
          buildingAgeYears: buildingAgeYears === "" ? undefined : buildingAgeYears,
          agencyFee: agencyFee || undefined,
          agreementFee: agreementFee || undefined,
          legalFee: legalFee || undefined,
          cautionFee: cautionFee || undefined,
          mandateName,
          mandatePhone,
          mandateEmail: mandateEmail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.formErrors?.join(", ") || "Couldn't save this listing");
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-8 space-y-6">
      <label className="block">
        <span className="text-sm font-medium">Listing URL</span>
        <div className="mt-1 flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://propertypro.ng/property/..."
            className="w-full rounded border border-neutral-300 px-3 py-2"
          />
          <button
            type="button"
            onClick={handleFetch}
            disabled={fetching || !url}
            className="whitespace-nowrap rounded border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50"
          >
            {fetching ? "Fetching..." : "Fetch details"}
          </button>
        </div>
        {fetchNote && <p className="mt-1 text-xs text-neutral-500">{fetchNote}</p>}
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">City</span>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value as City)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          >
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
            <option value="Port Harcourt">Port Harcourt</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Intent</span>
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
      </div>

      <label className="block">
        <span className="text-sm font-medium">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Neighborhood</span>
        <input
          type="text"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          required
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Price (₦)</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            min={0}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Bedrooms</span>
          <input
            type="number"
            value={bedrooms}
            onChange={(e) => setBedrooms(Number(e.target.value))}
            min={0}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Bathrooms</span>
          <input
            type="number"
            value={bathrooms}
            onChange={(e) => setBathrooms(Number(e.target.value))}
            min={0}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
      </div>

      <div>
        <span className="text-sm font-medium">Amenities</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => toggleAmenity(a)}
              className={`rounded-full border px-3 py-1 text-sm ${
                amenities.includes(a) ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Parking spaces</span>
          <input
            type="number"
            value={parkingSpaces}
            onChange={(e) => setParkingSpaces(Number(e.target.value))}
            min={0}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Floor</span>
          <select
            value={floor}
            onChange={(e) => setFloor(e.target.value as FloorLevel | "")}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          >
            <option value="">Not specified</option>
            <option value="Ground">Ground</option>
            <option value="1st">1st</option>
            <option value="2nd">2nd</option>
            <option value="3rd+">3rd+</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} />
          <span className="text-sm font-medium">Furnished</span>
        </label>
      </div>

      <div className="rounded-lg border border-neutral-200 p-4">
        <p className="text-sm font-medium">Dealbreaker-relevant details</p>
        <p className="text-xs text-neutral-500">
          Leave anything you&apos;re not sure of as &quot;Not specified&quot; — clients who care about
          it will see it flagged as unconfirmed rather than wrongly assumed.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs">Apartment type</span>
            <select
              value={apartmentType}
              onChange={(e) => setApartmentType(e.target.value as ApartmentType | "")}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            >
              <option value="">Not specified</option>
              <option value="flat">Flat</option>
              <option value="maisonette">Maisonette</option>
              <option value="duplex">Duplex</option>
              <option value="penthouse">Penthouse</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs">Road condition</span>
            <select
              value={roadCondition}
              onChange={(e) => setRoadCondition(e.target.value as typeof roadCondition)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            >
              <option value="">Not specified</option>
              <option value="excellent">Excellent</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs">Noise level</span>
            <select
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(e.target.value as typeof noiseLevel)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            >
              <option value="">Not specified</option>
              <option value="quiet">Quiet</option>
              <option value="moderate">Moderate</option>
              <option value="noisy">Noisy</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs">Flood-prone?</span>
            <select
              value={floodProne}
              onChange={(e) => setFloodProne(e.target.value as typeof floodProne)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            >
              <option value="">Not sure</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs">Has prepaid meter?</span>
            <select
              value={hasPrepaidMeter}
              onChange={(e) => setHasPrepaidMeter(e.target.value as typeof hasPrepaidMeter)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            >
              <option value="">Not sure</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs">Flats in compound</span>
            <input
              type="number"
              value={unitsInCompound}
              onChange={(e) => setUnitsInCompound(e.target.value === "" ? "" : Number(e.target.value))}
              min={1}
              placeholder="Not specified"
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-xs">Building age (years)</span>
            <input
              type="number"
              value={buildingAgeYears}
              onChange={(e) => setBuildingAgeYears(e.target.value === "" ? "" : Number(e.target.value))}
              min={0}
              placeholder="Not specified"
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">One-time fees (₦, optional)</p>
        <p className="text-xs text-neutral-500">Only fill in what the listing actually states — leave the rest blank.</p>
        <div className="mt-2 grid grid-cols-4 gap-4">
          <label className="block">
            <span className="text-xs">Agency fee</span>
            <input
              type="number"
              value={agencyFee}
              onChange={(e) => setAgencyFee(Number(e.target.value))}
              min={0}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-xs">Agreement fee</span>
            <input
              type="number"
              value={agreementFee}
              onChange={(e) => setAgreementFee(Number(e.target.value))}
              min={0}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-xs">Legal fee</span>
            <input
              type="number"
              value={legalFee}
              onChange={(e) => setLegalFee(Number(e.target.value))}
              min={0}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-xs">Caution fee</span>
            <input
              type="number"
              value={cautionFee}
              onChange={(e) => setCautionFee(Number(e.target.value))}
              min={0}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium">Mandate contact (required)</p>
        <p className="text-xs text-neutral-500">Whoever has authority to let/sell this property.</p>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Name</span>
            <input
              type="text"
              value={mandateName}
              onChange={(e) => setMandateName(e.target.value)}
              required
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Phone</span>
            <input
              type="text"
              value={mandatePhone}
              onChange={(e) => setMandatePhone(e.target.value)}
              required
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="text-sm font-medium">Email (optional)</span>
          <input
            type="email"
            value={mandateEmail}
            onChange={(e) => setMandateEmail(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-neutral-900 px-4 py-3 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save listing"}
        </button>
        {saved && <span className="text-sm text-green-700">Saved — it&apos;ll be matched against future client searches.</span>}
      </div>
    </form>
  );
}
