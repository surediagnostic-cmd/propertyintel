import { notFound } from "next/navigation";
import Link from "next/link";
import { getShortlist } from "@/lib/shortlistRepo";
import { ShortlistView } from "@/components/ShortlistView";
import { AgentNotesForm } from "@/components/AgentNotesForm";

export default async function AgentShortlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shortlist = await getShortlist(id);
  if (!shortlist) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/agent" className="text-sm text-neutral-500 underline">
        ← Back to dashboard
      </Link>
      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Shortlist review</h1>
        <Link
          href={`/agent/add-listing?shortlistId=${shortlist.id}`}
          className="whitespace-nowrap rounded bg-neutral-900 px-4 py-2 text-sm text-white"
        >
          + Add a listing for this client
        </Link>
      </div>
      <ShortlistView shortlist={shortlist} showMandateContact />
      <AgentNotesForm shortlistId={shortlist.id} initialNotes={shortlist.agentNotes} />
    </main>
  );
}
