-- Full intake expansion: soft preferences + hard dealbreakers a client can
-- state, and the matching Listing fields needed to actually check them.
-- See isShortlistEligible in src/lib/matching/score.ts — a dealbreaker only
-- excludes a listing when the listing itself states the relevant field;
-- missing data never causes exclusion, only an "unconfirmed" flag.

alter table propertyintel.searches
  add column if not exists apartment_type text,
  add column if not exists furnished_preference text,
  add column if not exists commute text,
  add column if not exists move_in_timeline text,
  add column if not exists agency_preference text,
  add column if not exists max_floor text,
  add column if not exists estate_requirement text,
  add column if not exists min_parking_spaces int not null default 0,
  add column if not exists road_condition_requirement text not null default 'no-preference',
  add column if not exists avoid_flood_prone boolean not null default false,
  add column if not exists avoid_noisy_areas boolean not null default false,
  add column if not exists require_prepaid_meter boolean not null default false,
  add column if not exists max_units_in_compound int,
  add column if not exists max_building_age_years int;

alter table propertyintel.listings
  add column if not exists apartment_type text,
  add column if not exists road_condition text,
  add column if not exists flood_prone boolean,
  add column if not exists noise_level text,
  add column if not exists has_prepaid_meter boolean,
  add column if not exists units_in_compound int,
  add column if not exists building_age_years int;
