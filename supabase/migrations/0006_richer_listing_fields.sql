-- Richer listing fields: fee breakdown (for a total move-in cost figure),
-- furnished/parking/floor metadata, and the originally-listed date kept
-- separate from source.scrapedAt (which stays the "last verified" date
-- used by the 72h eligibility gate).

alter table propertyintel.listings
  add column if not exists agency_fee numeric,
  add column if not exists agreement_fee numeric,
  add column if not exists legal_fee numeric,
  add column if not exists caution_fee numeric,
  add column if not exists furnished boolean,
  add column if not exists parking_spaces int,
  add column if not exists floor text,
  add column if not exists posted_at timestamptz;

-- An agent's own real assessment of a shortlist item — deliberately not an
-- AI-generated rating (see CLAUDE.md: don't claim unverified accuracy).
create type propertyintel.agent_rating as enum ('excellent', 'good', 'fair', 'avoid');

alter table propertyintel.shortlist_items
  add column if not exists agent_rating propertyintel.agent_rating;
