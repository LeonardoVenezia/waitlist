-- Migration 012: Showcase expiration for free plan
-- Free plan: product published for 1 year. After that, status flips to 'expired'
-- (data persists; user can re-publish by upgrading to Launch).

alter table public.showcases
  add column if not exists expires_at timestamptz,
  add column if not exists expired_at timestamptz,
  add column if not exists notified_30d_at timestamptz,
  add column if not exists notified_7d_at timestamptz;

-- Add 'expired' to the status enum
alter table public.showcases drop constraint if exists showcases_status_check;
alter table public.showcases add constraint showcases_status_check
  check (status in ('draft', 'published', 'expired', 'rejected', 'coming_soon'));

-- Add 'pending_unlock' to subscribers status (waitlist overflow)
alter table public.subscribers drop constraint if exists subscribers_status_check;
alter table public.subscribers add constraint subscribers_status_check
  check (status in ('active', 'hidden', 'blocked', 'pending_unlock'));

-- Index for the cron job (find due shows quickly)
create index if not exists idx_showcases_expires_at
  on public.showcases(expires_at)
  where expires_at is not null and status in ('published', 'coming_soon');
