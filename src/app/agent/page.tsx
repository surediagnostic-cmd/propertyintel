import Link from "next/link";
import { listShortlists } from "@/lib/shortlistRepo";

export default async function AgentDashboard() {
  const shortlists = await listShortlists();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Agent dashboard</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Client searches and their generated shortlists. Open one to review and add your notes
        before sending the client a report.
      </p>

      <div className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {shortlists.length === 0 && (
          <p className="p-5 text-sm text-neutral-500">No searches yet.</p>
        )}
        {shortlists.map((s) => (
          <Link
            key={s.id}
            href={`/agent/${s.id}`}
            className="flex items-center justify-between p-5 hover:bg-neutral-50"
          >
            <div>
              <p className="font-medium">
                {s.criteria.intent} in {s.criteria.city} · {s.criteria.bedrooms} bed
              </p>
              <p className="text-sm text-neutral-500">
                {s.items.length} matches · {new Date(s.createdAt).toLocaleString()}
              </p>
            </div>
            {s.agentNotes ? (
              <span className="text-xs text-green-700">Annotated</span>
            ) : (
              <span className="text-xs text-neutral-400">Needs review</span>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
