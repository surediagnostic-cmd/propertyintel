# PropertyIntel

Phase 1 of Petra Global Group's "certainty before commitment" product: a client describes what
they want in a house, the app shortlists the top 5–7 best-fit listings, and a physical agent turns
that into a report. See [CLAUDE.md](./CLAUDE.md) for full scope and open questions.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No setup required to try the golden path —
the matching engine runs against mock listing data (`src/lib/scraping/mockAdapter.ts`) and persists
searches to an in-memory dev store until Supabase is configured.

- `/` — landing page
- `/search` — client intake form (structured + free-text notes)
- `/results/[id]` — generated shortlist + comparison report
- `/agent` — agent dashboard listing all searches
- `/agent/[id]` — agent review view with a notes/recommendation field

## Enabling Supabase persistence

PropertyIntel uses the shared **SureDiagnostics** Supabase project (ref `zswlgmylduxxzbkzbnwi`,
region `aws-1-eu-west-1`) — the same project JMF Canteen runs on — but keeps its own tables
isolated in a `propertyintel` schema (same convention as JMF's `jmf` schema), so it can't collide
with tables from other apps in that project.

1. Open the Supabase SQL Editor for that project and run `supabase/migrations/0001_init.sql`.
   (Your local network blocks outbound Postgres ports, so CLI-based migrations/`db push` won't
   reach it — the SQL Editor is the way in, same workaround JMF uses.)
2. In Database > API > Exposed schemas, add `propertyintel` so PostgREST/`supabase-js` can see it.
3. Copy `.env.local.example` to `.env.local` and fill in the project URL, anon key, and service
   role key.

Once those env vars are set, `src/lib/shortlistRepo.ts` automatically persists to Supabase instead
of the in-memory store — no code changes needed. Note: `@supabase/supabase-js` talks over HTTPS
(PostgREST), so it works fine locally despite the Postgres-port firewall block — unlike JMF's
direct-Postgres Prisma setup.

## What's still mocked

- **Listings**: `mockAdapter.ts` returns a small fixed inventory. Real scraping of PropertyPro,
  NigeriaPropertyCentre, Jiji, and Hutbay is deferred pending per-site ToS/robots.txt review (see
  CLAUDE.md's legal/compliance stance).
- **Neighborhood signals**: `mockNeighborhoodSignals.ts` has placeholder, unverified summaries.
  Real public-data sources (crime stats, flood maps, telecom coverage) are an open question.
