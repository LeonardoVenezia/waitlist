-- 024_explicit_data_api_grants.sql
--
-- Supabase stops auto-granting new tables in `public` to the Data API roles
-- (new projects since 2026-05-30, existing projects from 2026-10-30).
-- Source: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
-- Existing tables keep their grants, so running this on the live project changes nothing that works today.
--
-- Grant-only (never revokes), idempotent, and skips tables/functions that do not exist
-- (a table that is missing is reported with a NOTICE). RLS still decides which rows each role sees.

do $$
declare
  t text;
  r record;
  fn text;
begin
  -- [table, role, privileges]
  for r in
    select * from (values
      -- service_role: server-side admin client
      ('profiles','service_role','select, insert, update, delete'),
      ('accounts','service_role','select, insert, update, delete'),
      ('account_members','service_role','select, insert, update, delete'),
      ('projects','service_role','select, insert, update, delete'),
      ('subscribers','service_role','select, insert, update, delete'),
      ('purchases','service_role','select, insert, update, delete'),
      ('subscriptions','service_role','select, insert, update, delete'),
      ('showcases','service_role','select, insert, update, delete'),
      ('page_events','service_role','select, insert, update, delete'),
      ('testimonial_forms','service_role','select, insert, update, delete'),
      ('testimonials','service_role','select, insert, update, delete'),
      ('testimonial_invites','service_role','select, insert, update, delete'),
      ('testimonial_form_visits','service_role','select, insert, update, delete'),
      ('project_claims','service_role','select, insert, update, delete'),
      ('email_queue','service_role','select, insert, update, delete'),
      -- authenticated: logged-in dashboard (RLS applies). Nothing on email_queue.
      ('profiles','authenticated','select, update'),
      ('accounts','authenticated','select, update'),
      ('account_members','authenticated','select, insert, update, delete'),
      ('projects','authenticated','select, insert, update, delete'),
      ('subscribers','authenticated','select'),
      ('purchases','authenticated','select'),
      ('subscriptions','authenticated','select'),
      ('showcases','authenticated','select, insert, update, delete'),
      ('page_events','authenticated','select'),
      ('testimonial_forms','authenticated','select, insert, update, delete'),
      ('testimonials','authenticated','select, insert, update, delete'),
      ('testimonial_invites','authenticated','select, insert, update, delete'),
      ('testimonial_form_visits','authenticated','select'),
      ('project_claims','authenticated','select, insert'),
      -- anon: only what the existing public policies allow
      ('projects','anon','select'),
      ('showcases','anon','select'),
      ('testimonial_forms','anon','select'),
      ('testimonials','anon','select, insert')
    ) as v(tbl, role_name, privs)
  loop
    if to_regclass('public.' || r.tbl) is null then
      raise notice 'skipped: public.% does not exist', r.tbl;
    else
      execute format('grant %s on public.%I to %I', r.privs, r.tbl, r.role_name);
    end if;
  end loop;

  execute 'grant usage on all sequences in schema public to service_role';

  foreach fn in array array['public.increment_referral_count(uuid)', 'public.get_position(uuid)']
  loop
    if to_regprocedure(fn) is null then
      raise notice 'skipped: function % does not exist', fn;
    else
      execute format('grant execute on function %s to service_role', fn);
    end if;
  end loop;
end $$;
