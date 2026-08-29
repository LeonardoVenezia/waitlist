-- Migration 015: Project claims
-- Founders can claim a product loaded by the admin in the public directory.
-- The admin reviews and approves/rejects manually. On approve, the project's
-- account_id is transferred to the claimant (project keeps its slug, settings,
-- and subscribers).

create table if not exists public.project_claims (
  id                uuid primary key default gen_random_uuid(),
  showcase_id       uuid not null references public.showcases(id) on delete cascade,
  claimant_user_id  uuid not null references public.profiles(id) on delete cascade,
  status            text not null default 'pending'
                      check (status in ('pending','approved','rejected')),
  message           text,
  rejected_reason   text,
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz,
  resolved_by       uuid references public.profiles(id)
);

-- One active claim (pending OR approved) per (showcase, user).
-- Prevents double-clicks and stops an already-approved user from re-claiming.
create unique index if not exists uq_active_claim_per_user_showcase
  on public.project_claims(showcase_id, claimant_user_id)
  where status in ('pending','approved');

create index if not exists idx_claims_status
  on public.project_claims(status, created_at desc);

create index if not exists idx_claims_showcase
  on public.project_claims(showcase_id);

create index if not exists idx_claims_claimant
  on public.project_claims(claimant_user_id);

alter table public.project_claims enable row level security;

-- Users can read their own claims (to render the badge on /product/[slug]).
create policy "Users read own claims" on project_claims
  for select using (auth.uid() = claimant_user_id);

-- Users can create claims for themselves. The application is responsible for
-- verifying that the user is not the current owner and the showcase is claimable.
create policy "Users insert own claims" on project_claims
  for insert with check (auth.uid() = claimant_user_id);

-- No update/delete policies for users: the admin mutates status via the service role.

comment on table public.project_claims is
  'Founder claims on admin-loaded showcases. Admin approves/rejects manually.';
