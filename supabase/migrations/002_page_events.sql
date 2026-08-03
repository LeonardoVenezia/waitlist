-- Track page views and signups on hosted pages
create table public.page_events (
  id          uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  type        text not null check (type in ('view', 'signup')),
  created_at  timestamptz default now()
);

create index idx_page_events_waitlist_date
  on public.page_events(waitlist_id, created_at);

-- RLS: account members can read
alter table public.page_events enable row level security;

create policy "Account member read events" on page_events
  for select using (
    exists (
      select 1 from waitlists w
      join account_members am on am.account_id = w.account_id
      where w.id = page_events.waitlist_id and am.user_id = auth.uid()
    )
  );

-- Insert via service_role (public page)
