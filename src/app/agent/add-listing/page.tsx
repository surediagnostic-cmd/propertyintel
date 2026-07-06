import Link from "next/link";
import { AddListingForm } from "@/components/AddListingForm";
import { ClientCriteriaSummary } from "@/components/ClientCriteriaSummary";
import { getShortlist } from "@/lib/shortlistRepo";

export default async function AddListingPage({
  searchParams,
}: {
  searchParams: Promise<{ shortlistId?: string }>;
}) {
  const { shortlistId } = await searchParams;
  const shortlist = shortlistId ? await getShortlist(shortlistId) : null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href={shortlist ? `/agent/${shortlist.id}` : "/agent"} className="text-sm text-neutral-500 underline">
        ← {shortlist ? "Back to shortlist review" : "Back to dashboard"}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Add a listing</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Paste a link to a real listing you found (PropertyPro or elsewhere). We&apos;ll try to
        auto-fill the details from PropertyPro links — for anything else, fill in the fields
        yourself. The mandate contact is required so this listing can be matched against client
        searches.
      </p>

      {shortlist && (
        <div className="mt-6">
          <p className="text-xs text-neutral-500">
            Use this to guide what you enter below — it&apos;s what this specific client asked for.
          </p>
          <div className="mt-2">
            <ClientCriteriaSummary criteria={shortlist.criteria} />
          </div>
        </div>
      )}

      <AddListingForm />
    </main>
  );
}
