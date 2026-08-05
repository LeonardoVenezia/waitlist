-- Showcase: product directory entries
create table public.showcases (
  id                  uuid primary key default gen_random_uuid(),
  waitlist_id         uuid not null unique references public.waitlists(id) on delete cascade,
  name                text not null,
  slug                text not null unique,
  link                text not null,
  description         text not null,
  category_1          text not null,
  category_2          text,
  images              jsonb not null default '[]'::jsonb,
  video_url           text,
  featured_badge      boolean not null default false,
  status              text not null default 'draft' check (status in ('draft', 'published', 'rejected')),
  domain_check_passed boolean not null default false,
  spam_check_passed   boolean not null default false,
  last_domain_check   timestamptz,
  last_spam_check     timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index idx_showcases_slug on public.showcases(slug);
create index idx_showcases_category on public.showcases(category_1, category_2);
create index idx_showcases_status on public.showcases(status);

-- RLS: anyone can read published
alter table public.showcases enable row level security;

create policy "Public read published" on showcases
  for select using (status = 'published');

-- RLS: account members can CRUD their own showcases
create policy "Account member all" on showcases
  for all using (
    exists (
      select 1 from waitlists w
      join account_members am on am.account_id = w.account_id
      where w.id = showcases.waitlist_id and am.user_id = auth.uid()
    )
  );

-- Update updated_at on row change
create or replace function update_showcase_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_showcase_updated
  before update on showcases
  for each row
  execute function update_showcase_timestamp();
