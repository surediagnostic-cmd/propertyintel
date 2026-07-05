-- PropertyIntel Phase 1 schema
-- Two front ends (consumer self-serve, agent dashboard) share these tables.
--
-- Lives in its own `propertyintel` schema inside the shared SureDiagnostics
-- Supabase project (same convention as JMF Canteen's `jmf` schema) so it
-- can't collide with tables from other apps in that project.
--
-- Run this whole file via the Supabase SQL Editor (Database > SQL Editor).
-- After running it, add `propertyintel` to Database > API > Exposed schemas
-- so PostgREST (and supabase-js) can see it.

create schema if not exists propertyintel;

-- Supabase projects ship with pgcrypto pre-installed (usually in the
-- `extensions` schema, which is on every role's search_path) — this is a
-- no-op if so, and only actually installs it if genuinely missing.
create extension if not exists pgcrypto;

create type propertyintel.listing_intent as enum ('rent', 'lease', 'buy');
create type propertyintel.listing_source_site as enum ('PropertyPro', 'NigeriaPropertyCentre', 'Jiji', 'Hutbay', 'Manual');
create type propertyintel.city as enum ('Lagos', 'Abuja', 'Port Harcourt');

-- Scraped/submitted listings, deduped by source url.
create table propertyintel.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  intent propertyintel.listing_intent not null,
  city propertyintel.city not null,
  neighborhood text not null,
  price numeric not null,
  bedrooms int not null default 0,
  bathrooms int not null default 0,
  amenities text[] not null default '{}',
  photos text[] not null default '{}',
  source_site propertyintel.listing_source_site not null,
  source_url text not null unique,
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index listings_city_intent_idx on propertyintel.listings (city, intent);
create index listings_neighborhood_idx on propertyintel.listings (neighborhood);

-- Unverified, public-data-derived signals per neighborhood (Phase 1 only;
-- field-verified data belongs to the Phase 2+ verification product).
create table propertyintel.neighborhood_signals (
  id uuid primary key default gen_random_uuid(),
  city propertyintel.city not null,
  neighborhood text not null,
  summary text not null,
  source_notes text,
  updated_at timestamptz not null default now(),
  unique (city, neighborhood)
);

-- Petra Global Group physical agents (Phase 1: staff only per CLAUDE.md open question).
create table propertyintel.agents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- One row per client search (structured form and/or free-text intake).
create table propertyintel.searches (
  id uuid primary key default gen_random_uuid(),
  client_email text,
  intent propertyintel.listing_intent not null,
  city propertyintel.city not null,
  neighborhoods text[] not null default '{}',
  min_budget numeric not null,
  max_budget numeric not null,
  bedrooms int not null default 0,
  bathrooms int not null default 0,
  must_have_amenities text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

-- The generated top 5-7 shortlist for a search.
create table propertyintel.shortlists (
  id uuid primary key default gen_random_uuid(),
  search_id uuid not null references propertyintel.searches (id) on delete cascade,
  agent_id uuid references propertyintel.agents (id),
  agent_notes text,
  created_at timestamptz not null default now()
);

create table propertyintel.shortlist_items (
  id uuid primary key default gen_random_uuid(),
  shortlist_id uuid not null references propertyintel.shortlists (id) on delete cascade,
  listing_id uuid not null references propertyintel.listings (id),
  match_score numeric not null,
  match_reasons text[] not null default '{}',
  rank int not null
);

create index shortlist_items_shortlist_idx on propertyintel.shortlist_items (shortlist_id);
