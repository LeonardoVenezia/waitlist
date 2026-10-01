alter table public.page_events
  add column source text not null default 'legacy'
  check (source in ('hosted', 'embed', 'api', 'legacy'));
