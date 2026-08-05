alter table public.showcases add column main_type text not null default 'image' check (main_type in ('image', 'video'));
