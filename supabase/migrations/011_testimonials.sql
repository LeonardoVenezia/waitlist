-- 011: Testimonials system
-- testimonial_forms: public collection forms
-- testimonials: collected testimonials

create table public.testimonial_forms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  questions jsonb default '[]'::jsonb,
  fields jsonb default '["name","email","message","rating"]'::jsonb,
  redirect_url text,
  design jsonb default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  form_id uuid references public.testimonial_forms(id) on delete set null,
  name text not null,
  email text,
  company text,
  role text,
  message text not null,
  rating smallint not null default 5 check (rating >= 1 and rating <= 5),
  avatar_url text,
  media_url text,
  media_type text not null default 'none' check (media_type in ('none','image','video')),
  source text not null default 'manual' check (source in ('form','manual','import')),
  tags text[] default '{}'::text[],
  is_featured boolean not null default false,
  status text not null default 'approved' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_testimonial_forms_project_id on public.testimonial_forms(project_id);
create index idx_testimonial_forms_slug on public.testimonial_forms(slug);
create index idx_testimonials_project_id on public.testimonials(project_id);
create index idx_testimonials_form_id on public.testimonials(form_id);
create index idx_testimonials_status on public.testimonials(status, project_id);
create index idx_testimonials_featured on public.testimonials(project_id, is_featured) where is_featured = true;

-- RLS: testimonial_forms
alter table public.testimonial_forms enable row level security;

-- Anyone can view published forms
create policy "Public can view published forms"
  on public.testimonial_forms for select
  using (status = 'published');

-- Project owners can manage their forms
create policy "Owners can manage forms"
  on public.testimonial_forms for all
  using (
    exists (
      select 1 from public.projects p
      join public.account_members am on am.account_id = p.account_id
      where p.id = testimonial_forms.project_id
      and am.user_id = auth.uid()
    )
  );

-- RLS: testimonials
alter table public.testimonials enable row level security;

-- Anyone can view approved testimonials
create policy "Public can view approved testimonials"
  on public.testimonials for select
  using (status = 'approved');

-- Anyone can insert from public form (verified server-side via API)
create policy "Anyone can insert testimonials"
  on public.testimonials for insert
  with check (true);

-- Project owners can manage their testimonials
create policy "Owners can manage testimonials"
  on public.testimonials for all
  using (
    exists (
      select 1 from public.projects p
      join public.account_members am on am.account_id = p.account_id
      where p.id = testimonials.project_id
      and am.user_id = auth.uid()
    )
  );

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_testimonial_forms_updated_at
  before update on public.testimonial_forms
  for each row execute function public.update_updated_at();

create trigger trg_testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.update_updated_at();
