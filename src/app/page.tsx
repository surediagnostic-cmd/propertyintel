import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center px-6 py-24">
      <p className="text-sm font-medium text-neutral-500">PropertyIntel · Petra Global Group</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        Certainty before commitment.
      </h1>
      <p className="mt-4 text-lg text-neutral-600">
        Tell us what you want in a house — budget, location, must-haves — and we&apos;ll shortlist
        the top 5–7 listings that actually fit. A PropertyIntel Agent turns that into a
        recommendation you can act on.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/search" className="rounded bg-neutral-900 px-5 py-3 text-white">
          Find my top matches
        </Link>
        <Link href="/agent" className="rounded border border-neutral-300 px-5 py-3">
          Agent dashboard
        </Link>
      </div>
    </main>
  );
}
