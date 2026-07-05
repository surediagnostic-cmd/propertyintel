-- Grants for the propertyintel schema, run after 0001_init.sql and after
-- adding `propertyintel` to Settings > API > Exposed schemas.
--
-- Only service_role writes (our server-side code, via the service role key).
-- anon/authenticated get read-only — the browser Supabase client isn't used
-- for writes anywhere in the app yet.

grant usage on schema propertyintel to anon, authenticated, service_role;

grant select on all tables in schema propertyintel to anon, authenticated;
grant all on all tables in schema propertyintel to service_role;

alter default privileges in schema propertyintel grant select on tables to anon, authenticated;
alter default privileges in schema propertyintel grant all on tables to service_role;
