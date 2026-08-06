alter table public.showcases drop constraint if exists showcases_status_check;
alter table public.showcases add constraint showcases_status_check 
  check (status in ('draft', 'published', 'rejected', 'building'));
