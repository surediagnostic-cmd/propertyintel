import { notFound } from "next/navigation";
import Link from "next/link";
import { getShortlist } from "@/lib/shortlistRepo";
import { ShortlistView } from "@/components/ShortlistView";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shortlist = await getShortlist(id);
  if (!shortlist) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your top {shortlist.items.length} matches</h1>
        <Link href="/agent" className="text-sm text-neutral-500 underline">
          View in agent dashboard
        </Link>
      </div>
      <ShortlistView shortlist={shortlist} />
    </main>
  );
}
