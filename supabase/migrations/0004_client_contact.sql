-- Client contact capture for the consumer -> agent handoff. A client can run
-- a search anonymously; client_name/client_phone/client_email and
-- submitted_to_agent_at are only populated once they explicitly choose to
-- send their results to an agent (see /api/shortlists/[id]/send-to-agent).

alter table propertyintel.searches
  add column if not exists client_name text,
  add column if not exists client_phone text;

alter table propertyintel.shortlists
  add column if not exists submitted_to_agent_at timestamptz;
