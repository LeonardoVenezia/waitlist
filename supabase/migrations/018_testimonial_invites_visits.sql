-- Migration 018: Testimonial form visits + invites
--
-- 1. `testimonial_form_visits`: one row per unique visitor per form. Deduped
--    by (form_id, visitor_hash) where visitor_hash is a daily-rotated
--    SHA-256 of ip + user-agent — no PII stored. Written by the public form
--    server component via service role; owners can read for stats.
-- 2. `testimonial_invites`: per-recipient tracking for "request testimonials"
--    emails. Lifecycle: queued -> sent (cron dispatch) -> opened (recipient
--    clicked through to /t/{slug}?i={token}) -> submitted (form sent with the
--    token). Unique on (form_id, email) so re-inviting the same person
--    updates the existing row instead of duplicating.

create table public.testimonial_form_visits (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.testimonial_forms(id) on delete cascade,
  visitor_hash text not null,
  created_at timestamptz not null default now(),
  unique (form_id, visitor_hash)
);

alter table public.testimonial_form_visits enable row level security;

create policy "Owners can view form visits"
  on public.testimonial_form_visits for select
  using (
    exists (
      select 1 from public.projects p
      join public.account_members am on am.account_id = p.account_id
      where p.id = testimonial_form_visits.form_id
      and am.user_id = auth.uid()
    )
  );

create table public.testimonial_invites (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.testimonial_forms(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'queued' check (status in ('queued','sent','opened','submitted')),
  sent_at timestamptz,
  opened_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (form_id, email)
);

alter table public.testimonial_invites enable row level security;

create policy "Owners can manage invites"
  on public.testimonial_invites for all
  using (
    exists (
      select 1 from public.projects p
      join public.account_members am on am.account_id = p.account_id
      where p.id = testimonial_invites.project_id
      and am.user_id = auth.uid()
    )
  );

create index if not exists testimonial_invites_form_idx on public.testimonial_invites (form_id);
create index if not exists testimonial_form_visits_form_idx on public.testimonial_form_visits (form_id);
