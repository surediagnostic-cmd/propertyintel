"use client";

import { useState } from "react";

export function SendToAgentForm({ shortlistId }: { shortlistId: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/shortlists/${shortlistId}/send-to-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.formErrors?.join(", ") || "Couldn't send this to an agent");
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-5 text-sm text-green-800">
        Sent — a PropertyIntel Agent will review your shortlist and follow up with {phone}.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-neutral-200 p-5">
      <h2 className="font-medium">Want an agent to help you take this further?</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Send this shortlist to a PropertyIntel Agent — they&apos;ll review it and reach out with a
        recommendation.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Phone</span>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
      </div>
      <label className="mt-3 block">
        <span className="text-sm font-medium">Email (optional)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send to an agent"}
      </button>
    </form>
  );
}
