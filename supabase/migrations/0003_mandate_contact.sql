-- Mandate-holder contact details, required for a listing to be shortlist-
-- eligible (see isShortlistEligible in src/lib/matching/score.ts, which also
-- gates on scraped_at being within the last 72 hours).

alter table propertyintel.listings
  add column if not exists contact_name text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text;
