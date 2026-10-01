alter table public.testimonials
  add column consent_confirmed_by uuid references auth.users(id) on delete set null,
  add column consent_confirmed_at timestamptz;
