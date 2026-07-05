import type { Shortlist } from "@/lib/types";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

export function ShortlistView({
  shortlist,
  showMandateContact = false,
}: {
  shortlist: Shortlist;
  showMandateContact?: boolean;
}) {
  const { criteria, items } = shortlist;

  return (
    <>
      <p className="text-sm text-neutral-500">
        {criteria.intent} in {criteria.city} · {formatNaira(criteria.minBudget)}–{formatNaira(criteria.maxBudget)} ·{" "}
        {criteria.bedrooms} bed / {criteria.bathrooms} bath
        {criteria.neighborhoods.length > 0 && <> · {criteria.neighborhoods.join(", ")}</>}
      </p>

      <div className="mt-8 space-y-6">
        {items.map((item, i) => (
          <div key={item.listing.id} className="rounded-lg border border-neutral-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-neutral-400">
                  #{i + 1} match · {item.matchScore}/100
                </p>
                <h2 className="text-lg font-medium">{item.listing.title}</h2>
                <p className="text-sm text-neutral-500">
                  {item.listing.neighborhood}, {item.listing.city} · {item.listing.bedrooms} bed /{" "}
                  {item.listing.bathrooms} bath
                </p>
              </div>
              <p className="text-lg font-semibold whitespace-nowrap">{formatNaira(item.listing.price)}</p>
            </div>

            {item.listing.amenities.length > 0 && (
              <p className="mt-3 text-sm">
                <span className="font-medium">Amenities: </span>
                {item.listing.amenities.join(", ")}
              </p>
            )}

            {item.matchReasons.length > 0 && (
              <p className="mt-1 text-sm text-neutral-500">
                <span className="font-medium">Why it matches: </span>
                {item.matchReasons.join(" · ")}
              </p>
            )}

            {item.neighborhoodSignal && (
              <p className="mt-3 rounded bg-neutral-50 p-3 text-sm text-neutral-600">
                <span className="font-medium">Neighborhood (unverified, public-data estimate): </span>
                {item.neighborhoodSignal.summary}
              </p>
            )}

            <p className="mt-3 text-xs text-neutral-400">
              Source: {item.listing.source.site} ·{" "}
              <a href={item.listing.source.url} target="_blank" rel="noreferrer" className="underline">
                view original listing
              </a>
            </p>

            {showMandateContact && item.listing.mandateContact && (
              <p className="mt-2 rounded bg-amber-50 p-3 text-sm text-neutral-700">
                <span className="font-medium">Mandate contact: </span>
                {item.listing.mandateContact.name} · {item.listing.mandateContact.phone}
                {item.listing.mandateContact.email && <> · {item.listing.mandateContact.email}</>}
              </p>
            )}
          </div>
        ))}
      </div>

      {criteria.notes && (
        <p className="mt-8 text-sm text-neutral-500">
          <span className="font-medium">Client notes: </span>
          {criteria.notes}
        </p>
      )}
    </>
  );
}
