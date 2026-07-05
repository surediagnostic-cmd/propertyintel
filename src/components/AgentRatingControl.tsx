"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AgentRating } from "@/lib/types";

const OPTIONS: { value: AgentRating; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "avoid", label: "Avoid" },
];

export function AgentRatingControl({
  shortlistId,
  listingId,
  currentRating,
}: {
  shortlistId: string;
  listingId: string;
  currentRating?: AgentRating;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function setRating(rating: AgentRating) {
    setSaving(true);
    try {
      await fetch(`/api/shortlists/${shortlistId}/rating`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, rating }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={saving}
          onClick={() => setRating(o.value)}
          className={`rounded-full border px-2 py-0.5 text-xs disabled:opacity-50 ${
            currentRating === o.value ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
