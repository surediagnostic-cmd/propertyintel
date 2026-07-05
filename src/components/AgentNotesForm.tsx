"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AgentNotesForm({ shortlistId, initialNotes }: { shortlistId: string; initialNotes?: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/shortlists/${shortlistId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-neutral-200 p-5">
      <h2 className="font-medium">Agent notes / recommendation</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        className="mt-2 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        placeholder="Your recommendation for the client, caveats, next steps..."
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save notes"}
        </button>
        {saved && <span className="text-xs text-green-700">Saved</span>}
      </div>
    </div>
  );
}
