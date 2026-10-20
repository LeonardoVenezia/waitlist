-- 024_explicit_data_api_grants.sql
--
-- Supabase stops auto-granting new tables in `public` to the Data API roles
-- (new projects since 2026-05-30, existing projects from 2026-10-30).
-- Source: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
-- Existing tables keep their current grants, so running this on the live project
-- changes nothing that works today. It makes a fresh project / db reset / preview
-- branch work, and documents the minimum each role needs.
--
-- Grants are only a first layer. Row Level Security (already enabled on every
-- table) still decides which rows each role sees.
-- This migration only ADDS grants. It does not revoke anything.
-- Safe to run more than once.

-- service_role: used by createAdminClient() on the server. Bypasses RLS but still needs table privileges.
grant select, insert, update, delete on
  public.profiles, public.accounts, public.account_members, public.projects,
  public.subscribers, public.purchases, public.subscriptions, public.showcases,
  public.page_events, public.testimonial_forms, public.testimonials,
  public.testimonial_invites, public.testimonial_form_visits,
  public.project_claims, public.email_queue
to service_role;
grant usage on all sequences in schema public to service_role;
grant execute on function public.increment_referral_count(uuid) to service_role;
grant execute on function public.get_position(uuid) to service_role;

-- authenticated: the logged-in dashboard (user client, RLS applies).
grant select on
  public.profiles, public.accounts, public.account_members, public.projects,
  public.subscribers, public.purchases, public.subscriptions, public.showcases,
  public.page_events, public.testimonial_forms, public.testimonials,
  public.testimonial_invites, public.testimonial_form_visits, public.project_claims
to authenticated;
grant update on public.profiles, public.accounts to authenticated;
grant insert, update, delete on
  public.projects, public.showcases, public.testimonial_forms,
  public.testimonials, public.testimonial_invites, public.account_members
to authenticated;
grant insert on public.project_claims to authenticated;
-- email_queue: no policies for users, so no grants for authenticated (server only).

-- anon: only what the existing public policies allow.
grant select on public.projects, public.showcases, public.testimonial_forms, public.testimonials to anon;
grant insert on public.testimonials to anon;  -- policy "Anyone can insert testimonials"
-- Nothing for anon on subscribers, subscriptions, purchases, email_queue, invites, claims, accounts, profiles.

-- OPTIONAL hardening (do NOT run without checking the app first). Projects created before the
-- change still carry the old broad default grants (all privileges to anon/authenticated).
-- Review with the check query in TASKS.md, then trim, for example:
--   revoke all on public.subscribers, public.subscriptions, public.purchases, public.email_queue,
--     public.accounts, public.profiles, public.account_members, public.project_claims,
--     public.testimonial_invites, public.testimonial_form_visits, public.page_events from anon;
