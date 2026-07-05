"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { City, ListingIntent } from "@/lib/types";

export function AddYourOwnListingForm({
  shortlistId,
  city,
  intent,
}: {
  shortlistId: string;
  city: City;
  intent: ListingIntent;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [price, setPrice] = useState(0);
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);

  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setFetchNote("Auto-filled from the listing. Double-check before adding.");
      } else {
        setFetchNote("Couldn't auto-fetch this link — fill in the details below yourself.");
      }
    } finally {
      setFetching(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/shortlists/${shortlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title, neighborhood, price, bedrooms, bathrooms, amenities: [], photos: [] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.formErrors?.join(", ") || "Couldn't add this listing");
        return;
      }
      setUrl("");
      setTitle("");
      setNeighborhood("");
      setPrice(0);
      setBedrooms(0);
      setBathrooms(0);
      setExpanded(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mt-6 w-full rounded border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-600"
      >
        + Found one yourself? Add a link to your shortlist
      </button>
    );
  }

  return (
    <form onSubmit={handleAdd} className="mt-6 rounded-lg border border-neutral-200 p-5">
      <h2 className="font-medium">Add a listing you found</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Paste a link and we&apos;ll try to fill in the details — this gets added to your shortlist
        alongside our matches, so your agent sees it too.
      </p>

      <label className="mt-3 block">
        <span className="text-sm font-medium">Listing URL</span>
        <div className="mt-1 flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://..."
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

      <label className="mt-3 block">
        <span className="text-sm font-medium">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-sm font-medium">Neighborhood</span>
        <input
          type="text"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          required
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <div className="mt-3 grid grid-cols-3 gap-4">
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

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add to my shortlist"}
        </button>
        <button type="button" onClick={() => setExpanded(false)} className="text-sm text-neutral-500 underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
