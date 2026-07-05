import Link from "next/link";
import { listShortlists } from "@/lib/shortlistRepo";

export default async function AgentDashboard() {
  const shortlists = await listShortlists();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agent dashboard</h1>
        <Link href="/agent/add-listing" className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">
          + Add listing
        </Link>
      </div>
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
                {s.clientContact && <> · {s.clientContact.name} ({s.clientContact.phone})</>}
              </p>
              <p className="text-sm text-neutral-500">
                {s.items.length} matches · {new Date(s.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {s.submittedToAgentAt && <span className="text-xs font-medium text-blue-700">Client requested</span>}
              {s.agentNotes ? (
                <span className="text-xs text-green-700">Annotated</span>
              ) : (
                <span className="text-xs text-neutral-400">Needs review</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
