-- Waitlist by [PACK]
-- Complete database schema

-- =============================
-- PROFILES
-- =============================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users update own profile" on profiles
  for update using (auth.uid() = id);

-- =============================
-- ACCOUNTS (backbone for multi-product pack)
-- =============================
create table public.accounts (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id),
  name       text not null,
  created_at timestamptz default now()
);

alter table public.accounts enable row level security;
create policy "Owner access" on accounts
  for all using (auth.uid() = owner_id);

-- =============================
-- ACCOUNT MEMBERS (teams — future use)
-- =============================
create table public.account_members (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id),
  role       text not null default 'member' check (role in ('owner','admin','member')),
  unique(account_id, user_id)
);

alter table public.account_members enable row level security;

create policy "Members read" on account_members
  for select using (auth.uid() = user_id);
create policy "Owner manage members" on account_members
  for all using (
    exists (
      select 1 from accounts
      where accounts.id = account_members.account_id
        and accounts.owner_id = auth.uid()
    )
  );

-- =============================
-- WAITLISTS (the "project")
-- =============================
create table public.waitlists (
  id               uuid primary key default gen_random_uuid(),
  account_id       uuid not null references public.accounts(id) on delete cascade,
  name             text not null,
  slug             text not null unique,
  public_key       text not null unique default encode(gen_random_bytes(16), 'hex'),
  plan             text not null default 'free' check (plan in ('free','launch','grow','scale')),
  submission_limit int not null default 150,
  settings         jsonb not null default '{
    "branding": {"logo_url": null, "primary_color": "#22c563", "font": null},
    "hero": {"title": "", "subtitle": "", "cta_label": "Join the waitlist"},
    "form": {"fields": [{"name": "email", "type": "email", "required": true}], "collect_name": false},
    "thank_you": {"message": "", "show_position": true, "show_referral_link": true, "show_leaderboard": true},
    "referral": {"enabled": true, "positions_per_referral": 10, "starting_position_offset": 0, "reward_text": "", "milestones": []},
    "notifications": {"email_on_signup": true, "slack_webhook_url": null, "welcome_email": false},
    "language": "en",
    "remove_branding": false
  }'::jsonb,
  status           text not null default 'active' check (status in ('active','archived')),
  created_at       timestamptz default now()
);

alter table public.waitlists enable row level security;

create policy "Account member access" on waitlists
  for all using (
    exists (
      select 1 from account_members
      where account_id = waitlists.account_id
        and user_id = auth.uid()
    )
  );
create policy "Account member select" on waitlists
  for select using (
    exists (
      select 1 from account_members
      where account_id = waitlists.account_id
        and user_id = auth.uid()
    )
  );

-- Public read for widget (only config/branding, no subscriber data)
create policy "Public read waitlist config" on waitlists
  for select using (true);

-- =============================
-- SUBSCRIBERS (waitlist entries)
-- =============================
create table public.subscribers (
  id              uuid primary key default gen_random_uuid(),
  waitlist_id     uuid not null references public.waitlists(id) on delete cascade,
  email           text not null,
  referral_code   text not null,
  referred_by     uuid references public.subscribers(id),
  referral_count  int not null default 0,
  verified        boolean not null default false,
  status          text not null default 'active' check (status in ('active','hidden','blocked')),
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz default now(),
  unique(waitlist_id, email),
  unique(waitlist_id, referral_code)
);

create index idx_subscribers_waitlist_ranking
  on public.subscribers(waitlist_id, referral_count desc, created_at asc);
create index idx_subscribers_referral_code
  on public.subscribers(waitlist_id, referral_code);

alter table public.subscribers enable row level security;

create policy "Account member read subscribers" on subscribers
  for select using (
    exists (
      select 1 from waitlists w
      join account_members am on am.account_id = w.account_id
      where w.id = subscribers.waitlist_id and am.user_id = auth.uid()
    )
  );

-- =============================
-- PURCHASES (Paddle transaction audit)
-- =============================
create table public.purchases (
  id                    uuid primary key default gen_random_uuid(),
  account_id            uuid not null references public.accounts(id),
  waitlist_id           uuid not null references public.waitlists(id),
  paddle_transaction_id text not null unique,
  plan                  text not null,
  amount                numeric not null,
  currency              text not null,
  status                text not null default 'completed',
  created_at            timestamptz default now()
);

alter table public.purchases enable row level security;

create policy "Account member read purchases" on purchases
  for select using (
    exists (
      select 1 from account_members
      where account_id = purchases.account_id
        and user_id = auth.uid()
    )
  );

-- =============================
-- AUTO-CREATE PROFILE + ACCOUNT ON SIGNUP
-- =============================
create function public.handle_new_user()
returns trigger as $$
declare
  v_account_id uuid;
begin
  -- Create profile
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );

  -- Create account
  insert into public.accounts (owner_id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  returning id into v_account_id;

  -- Add as owner member
  insert into public.account_members (account_id, user_id, role)
  values (v_account_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================
-- INCREMENT REFERRAL COUNT
-- =============================
create function public.increment_referral_count(p_subscriber_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.subscribers
  set referral_count = referral_count + 1
  where id = p_subscriber_id;
end;
$$;

-- =============================
-- POSITION CALCULATION
-- =============================
create function public.get_position(p_subscriber_id uuid)
returns integer
language sql
stable
as $$
  select position from (
    select id, row_number() over (
      order by referral_count desc, created_at asc
    ) as position
    from subscribers
    where waitlist_id = (select waitlist_id from subscribers where id = p_subscriber_id)
      and status = 'active'
  ) t where id = p_subscriber_id;
$$;
