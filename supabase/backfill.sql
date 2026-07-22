-- Backfill: crea perfiles, cuentas y membresías para usuarios existentes
-- que se registraron antes de que existiera el trigger.

insert into public.profiles (id, email, full_name)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data ->> 'full_name', split_part(au.email, '@', 1))
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null;

insert into public.accounts (owner_id, name)
select
  p.id,
  coalesce(p.full_name, split_part(p.email, '@', 1))
from public.profiles p
left join public.accounts a on a.owner_id = p.id
where a.id is null;

insert into public.account_members (account_id, user_id, role)
select
  a.id,
  a.owner_id,
  'owner'
from public.accounts a
left join public.account_members am on am.account_id = a.id and am.user_id = a.owner_id
where am.id is null;
