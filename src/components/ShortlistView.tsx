import type { AgentRating, FeeBreakdown, Shortlist } from "@/lib/types";
import { AgentRatingControl } from "@/components/AgentRatingControl";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function formatListedAt(iso: string) {
  const date = new Date(iso);
  const hoursAgo = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
  const relative = hoursAgo <= 0 ? "just now" : hoursAgo === 1 ? "1 hour ago" : `${hoursAgo} hours ago`;
  const absolute = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(date);
  return `${relative} (${absolute})`;
}

function totalMoveInCost(price: number, fees?: FeeBreakdown): number | undefined {
  if (!fees) return undefined;
  const sum = (fees.agencyFee ?? 0) + (fees.agreementFee ?? 0) + (fees.legalFee ?? 0) + (fees.cautionFee ?? 0);
  return sum > 0 ? price + sum : undefined;
}

function approximateMapsUrl(neighborhood: string, city: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${neighborhood}, ${city}, Nigeria`)}`;
}

const RATING_LABEL: Record<AgentRating, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  avoid: "Avoid",
};

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
                  {item.addedByClient ? (
                    <span className="text-blue-700">Added by you</span>
                  ) : (
                    <>#{i + 1} match · {item.matchScore}/100</>
                  )}
                </p>
                <h2 className="text-lg font-medium">{item.listing.title}</h2>
                <p className="text-sm text-neutral-500">
                  {item.listing.neighborhood}, {item.listing.city} · {item.listing.bedrooms} bed /{" "}
                  {item.listing.bathrooms} bath
                  {item.listing.floor && <> · {item.listing.floor} floor</>}
                  {item.listing.parkingSpaces !== undefined && <> · {item.listing.parkingSpaces} parking</>}
                  {item.listing.furnished !== undefined && <> · {item.listing.furnished ? "Furnished" : "Unfurnished"}</>}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold whitespace-nowrap">{formatNaira(item.listing.price)}</p>
                {totalMoveInCost(item.listing.price, item.listing.feeBreakdown) !== undefined && (
                  <p className="text-xs text-neutral-500 whitespace-nowrap">
                    {formatNaira(totalMoveInCost(item.listing.price, item.listing.feeBreakdown)!)} total move-in
                  </p>
                )}
              </div>
            </div>

            {item.listing.amenities.length > 0 && (
              <p className="mt-3 text-sm">
                <span className="font-medium">Amenities: </span>
                {item.listing.amenities.join(", ")}
              </p>
            )}

            {item.listing.feeBreakdown && (
              <p className="mt-1 text-sm text-neutral-500">
                <span className="font-medium">Fees: </span>
                {[
                  item.listing.feeBreakdown.agencyFee && `Agency ${formatNaira(item.listing.feeBreakdown.agencyFee)}`,
                  item.listing.feeBreakdown.agreementFee && `Agreement ${formatNaira(item.listing.feeBreakdown.agreementFee)}`,
                  item.listing.feeBreakdown.legalFee && `Legal ${formatNaira(item.listing.feeBreakdown.legalFee)}`,
                  item.listing.feeBreakdown.cautionFee && `Caution ${formatNaira(item.listing.feeBreakdown.cautionFee)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
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
              {item.listing.postedAt && <>Listed {formatListedAt(item.listing.postedAt)} · </>}
              Last verified {formatListedAt(item.listing.source.scrapedAt)} ·{" "}
              <a href={item.listing.source.url} target="_blank" rel="noreferrer" className="underline">
                view original listing
              </a>{" "}
              ·{" "}
              <a
                href={approximateMapsUrl(item.listing.neighborhood, item.listing.city)}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                approximate area on Google Maps
              </a>
            </p>

            {showMandateContact && item.listing.mandateContact && (
              <p className="mt-2 rounded bg-amber-50 p-3 text-sm text-neutral-700">
                <span className="font-medium">Mandate contact: </span>
                {item.listing.mandateContact.name} · {item.listing.mandateContact.phone}
                {item.listing.mandateContact.email && <> · {item.listing.mandateContact.email}</>}
              </p>
            )}

            {item.agentRating && (
              <p className="mt-2 text-xs font-medium text-neutral-600">
                Agent assessment: {RATING_LABEL[item.agentRating]}
              </p>
            )}
            {showMandateContact && (
              <AgentRatingControl
                shortlistId={shortlist.id}
                listingId={item.listing.id}
                currentRating={item.agentRating}
              />
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
