import { notFound } from "next/navigation";
import { getShortlist } from "@/lib/shortlistRepo";
import { ShortlistView } from "@/components/ShortlistView";
import { SendToAgentForm } from "@/components/SendToAgentForm";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shortlist = await getShortlist(id);
  if (!shortlist) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Your top {shortlist.items.length} matches</h1>
      <ShortlistView shortlist={shortlist} />
      {shortlist.submittedToAgentAt ? (
        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-5 text-sm text-green-800">
          Sent to an agent on {new Date(shortlist.submittedToAgentAt).toLocaleString()} — they&apos;ll follow up
          with {shortlist.clientContact?.phone}.
        </div>
      ) : (
        <SendToAgentForm shortlistId={shortlist.id} />
      )}
    </main>
  );
}
