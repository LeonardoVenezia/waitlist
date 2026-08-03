-- Add email validation status, name, and country columns to subscribers
alter table public.subscribers
  add column if not exists email_status text,
  add column if not exists name text,
  add column if not exists country text;

-- Index for email status filtering
create index if not exists idx_subscribers_email_status
  on public.subscribers(waitlist_id, email_status);
