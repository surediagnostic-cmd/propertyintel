# PropertyIntel — Project Scope & Guidance

## Vision (long-term, not this build)
Petra Global Group is not competing with PropertyPro, NigeriaPropertyCentre, Jiji, or Hutbay on
listing volume. The long-term product is **"Certainty before commitment"** — a trust and
decision-intelligence layer over Nigerian real estate: house verification, neighborhood
intelligence, agent verification, landlord ratings, and full due-diligence reports. That vision
unfolds in phases over time. **This repo is Phase 1.**

## What Phase 1 actually is
A search-and-shortlist engine: a client describes what they want in a house (budget, location,
bedrooms, rent/lease/buy, must-haves), the system scrapes the major Nigerian listing sites, scores
candidates against those criteria, and returns the **top 5–7 best-fit listings**. A physical agent
then reviews/annotates that shortlist and turns it into a client-facing report or recommendation.

This is deliberately architected as the on-ramp to the bigger vision: the matching engine and data
model should have clean seams for bolting on neighborhood scoring, agent verification, and landlord
ratings later (Phases 2–4) without a rewrite — but Phase 1 itself ships lean.

## Two products, one engine
Both front ends call the same matching/scraping engine and data model — do not fork the logic.

1. **Consumer self-serve app** — a client submits their desires directly and gets a shortlist +
   comparison report themselves.
2. **Agent dashboard (CRM-style module)** — a Petra Global Group physical agent logs in, pulls
   shortlists on behalf of their clients, annotates them, and produces the final report.

The "plugin" is the AI-assisted intake/matching component surfaced inside both: a conversational
tool that takes a client's stated wishes (structured or free text) and turns them into search
criteria, then explains/ranks the resulting shortlist.

## Geography (MVP)
Lagos, Abuja, Port Harcourt. Neighborhood examples to model against: Lekki Phase 1, Chevron,
Magodo, Gbagada, Surulere (Lagos), plus equivalent high-demand areas in Abuja and PH — confirm the
initial neighborhood list before scraping begins.

## Data sourcing — scraping
- Primary source is scraping major Nigerian listing sites: PropertyPro, NigeriaPropertyCentre,
  Jiji, Hutbay (confirm final source list).
- Before scraping any given site: read and document its ToS and `robots.txt`. If a site's terms
  explicitly prohibit scraping, drop it as a source or pursue an API/partnership instead — don't
  build around a prohibition.
- Respect rate limits and site load; no aggressive concurrency, no CAPTCHA bypassing, no
  credential-based access to paywalled data, no techniques designed to evade a site's bot
  detection. If a site blocks scraping, that's a signal to negotiate a partnership or drop it, not
  to engineer around the block.
- Store scraped listings in our own DB (Supabase/Postgres) with source attribution and a
  last-verified timestamp — this becomes the seed of the proprietary property database referenced
  in the long-term vision.

## Intake
Support both:
- **Structured form**: budget, location(s), bedroom/bathroom count, rent vs. lease vs. buy,
  must-have amenities, timeline.
- **Conversational/AI intake**: client describes what they want in free text; an LLM extracts the
  same structured criteria from it.
Both paths should normalize into one internal criteria schema before matching runs.

## Matching & report depth (MVP)
- Score scraped listings against the client's criteria; return top 5–7.
- Report includes: side-by-side comparison table (price, specs, photos, source link) **plus**
  lightweight neighborhood signals pulled from free/public data (general area reputation, rough
  commute estimate, etc.) — no physical field verification at this stage.
- Do not claim verified accuracy for anything not field-checked. Label public-data signals clearly
  as unverified estimates, distinct from the future paid "Verified" product (Phase 5-style
  due-diligence report from the long-term vision). This is the natural upsell path once a client
  has a shortlist they like.

## Tech stack
Next.js + Supabase, consistent with other Petra/Sure projects. Scraping workers can run as
scheduled Supabase Edge Functions or a separate Node worker service — decide based on scraping
volume/frequency once source sites are finalized.

**Supabase project**: shared SureDiagnostics project (ref `zswlgmylduxxzbkzbnwi`, region
`aws-1-eu-west-1`) — same project JMF Canteen uses — with its own `propertyintel` schema (not
`public`), matching JMF's `jmf`-schema convention so tables never collide across apps. See
[README.md](./README.md) for the exact setup steps, including the local-network Postgres-port
firewall workaround (run migrations via the Supabase SQL Editor, not the CLI).

## Monetization (MVP, tiered — reconcile as you build)
- Free tier: basic shortlist (lead magnet).
- Paid: full comparison report with neighborhood signals, flat per-search fee.
- Agents: subscription or per-lead pricing to access the agent dashboard and client shortlists.
- Future: B2B/white-label licensing of the matching engine to other agencies.

## Timeline
Fast MVP, small/solo team, target 60–90 days for a working Phase 1 (consistent with the phased
rollout in the long-term vision doc).

## Explicitly out of scope for this build
- Physical property verification / field officer visits (Service 1 in the long-term vision).
- Agent verification badges / NIN-CAC checks (Service 3).
- Landlord ratings (Service 4).
- Full ownership/litigation/encumbrance due-diligence reports (Service 5).
These are Phases 2–4. Design the data model so they can be added later, but don't build them now.

## Open questions (unresolved — confirm before/while building)
- Final list of source sites to scrape beyond PropertyPro/NigeriaPropertyCentre/Jiji/Hutbay.
- Exact pricing figures for the free vs. paid tiers and agent subscription.
- Product/app name and branding (currently just "PropertyIntel" as a working name).
- Legal sign-off process: who reviews each site's ToS before scraping goes live?
- Which public data sources feed the "lightweight neighborhood signals" (crime stats, flood maps,
  telecom coverage, etc.) — need a real source list, not just placeholders.
- Mobile app timing — web is first, but no committed date for iOS/Android yet.
- ~~Which Supabase project to use~~ — resolved: shared SureDiagnostics project, `propertyintel` schema.
- LLM/provider choice for the conversational intake parser.
- Whether agents are exclusively Petra Global Group staff or can include vetted third-party agents
  at this stage (affects the agent dashboard's access model).
