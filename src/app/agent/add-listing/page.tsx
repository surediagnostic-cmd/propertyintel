import Link from "next/link";
import { AddListingForm } from "@/components/AddListingForm";

export default function AddListingPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/agent" className="text-sm text-neutral-500 underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Add a listing</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Paste a link to a real listing you found (PropertyPro or elsewhere). We&apos;ll try to
        auto-fill the details from PropertyPro links — for anything else, fill in the fields
        yourself. The mandate contact is required so this listing can be matched against client
        searches.
      </p>
      <AddListingForm />
    </main>
  );
}
