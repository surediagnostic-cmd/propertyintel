-- Distinguishes a shortlist item the matching engine picked from one a
-- client manually added themselves (see /api/shortlists/[id]/items) —
-- client additions skip the 72h/mandate-contact eligibility gate entirely,
-- since the client is vouching for the listing directly.

alter table propertyintel.shortlist_items
  add column if not exists added_by_client boolean not null default false;
