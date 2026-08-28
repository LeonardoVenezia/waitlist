-- Migration 014: Email queue for transactional emails sent by cron.
-- Used by the showcase expiry reminder system and any other future
-- scheduled-transactional flows.
-- Only the service role can read/write — no RLS policies for users.

create table if not exists public.email_queue (
  id          uuid primary key default gen_random_uuid(),
  to_email    text not null,
  subject     text not null,
  template    text not null,
  payload     jsonb not null default '{}'::jsonb,
  status      text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts    int not null default 0,
  last_error  text,
  created_at  timestamptz default now(),
  sent_at     timestamptz
);

create index if not exists idx_email_queue_status_created
  on public.email_queue(status, created_at)
  where status = 'pending';

alter table public.email_queue enable row level security;
-- No public policies — only service role bypasses RLS.

comment on table public.email_queue is
  'Outbound email queue. Workers (cron endpoint) drain pending rows.';
