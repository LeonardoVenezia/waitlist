alter table public.subscribers drop constraint if exists subscribers_waitlist_id_fkey;
alter table public.purchases drop constraint if exists purchases_waitlist_id_fkey;
alter table public.showcases drop constraint if exists showcases_waitlist_id_fkey;

alter table public.waitlists rename to projects;

alter table public.subscribers add constraint subscribers_waitlist_id_fkey 
  foreign key (waitlist_id) references public.projects(id) on delete cascade;
alter table public.purchases add constraint purchases_waitlist_id_fkey 
  foreign key (waitlist_id) references public.projects(id);
alter table public.showcases add constraint showcases_waitlist_id_fkey 
  foreign key (waitlist_id) references public.projects(id) on delete cascade;
