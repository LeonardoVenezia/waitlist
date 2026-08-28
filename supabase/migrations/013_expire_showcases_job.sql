-- Migration 013: Daily job to expire showcases + send reminder emails.
-- Requires pg_cron extension enabled on the Supabase project.
-- The function flips status to 'expired' for past-due shows, and enqueues
-- reminder emails for shows 30d / 7d away from expiration.

create extension if not exists pg_cron;

-- =============================
-- EXPIRE DUE SHOWCASES
-- =============================
create or replace function public.expire_due_showcases()
returns void
language plpgsql
security definer
as $$
begin
  -- 1) Flip status to expired for shows past their expires_at
  update public.showcases
  set status = 'expired',
      expired_at = now()
  where status in ('published', 'coming_soon')
    and expires_at is not null
    and expires_at <= now();
end;
$$;

-- =============================
-- ENQUEUE REMINDER EMAILS
-- =============================
create or replace function public.enqueue_expiry_reminders()
returns void
language plpgsql
security definer
as $$
begin
  -- 30-day reminder
  insert into public.email_queue (to_email, subject, template, payload)
  select
    owner_profile.email,
    'Tu showcase vence en 30 días',
    'showcase-expiry-30d',
    jsonb_build_object(
      'showcase_id', s.id,
      'showcase_name', s.name,
      'expires_at', s.expires_at,
      'project_id', s.waitlist_id,
      'account_id', p.account_id
    )
  from public.showcases s
  join public.projects p on p.id = s.waitlist_id
  join public.accounts a on a.id = p.account_id
  join public.profiles owner_profile on owner_profile.id = a.owner_id
  where s.status in ('published', 'coming_soon')
    and s.expires_at is not null
    and s.expires_at between now() and now() + interval '30 days'
    and s.notified_30d_at is null;

  update public.showcases s
  set notified_30d_at = now()
  from public.projects p
  join public.accounts a on a.id = p.account_id
  where s.waitlist_id = p.id
    and s.status in ('published', 'coming_soon')
    and s.expires_at is not null
    and s.expires_at between now() and now() + interval '30 days'
    and s.notified_30d_at is null
    and s.id in (
      select id from public.showcases
      where notified_30d_at is null
        and expires_at between now() and now() + interval '30 days'
        and status in ('published', 'coming_soon')
    );

  -- 7-day reminder
  insert into public.email_queue (to_email, subject, template, payload)
  select
    owner_profile.email,
    'Tu showcase vence en 7 días',
    'showcase-expiry-7d',
    jsonb_build_object(
      'showcase_id', s.id,
      'showcase_name', s.name,
      'expires_at', s.expires_at,
      'project_id', s.waitlist_id,
      'account_id', p.account_id
    )
  from public.showcases s
  join public.projects p on p.id = s.waitlist_id
  join public.accounts a on a.id = p.account_id
  join public.profiles owner_profile on owner_profile.id = a.owner_id
  where s.status in ('published', 'coming_soon')
    and s.expires_at is not null
    and s.expires_at between now() and now() + interval '7 days'
    and s.notified_7d_at is null;

  update public.showcases s
  set notified_7d_at = now()
  from public.projects p
  join public.accounts a on a.id = p.account_id
  where s.waitlist_id = p.id
    and s.status in ('published', 'coming_soon')
    and s.expires_at is not null
    and s.expires_at between now() and now() + interval '7 days'
    and s.notified_7d_at is null
    and s.id in (
      select id from public.showcases
      where notified_7d_at is null
        and expires_at between now() and now() + interval '7 days'
        and status in ('published', 'coming_soon')
    );
end;
$$;

-- =============================
-- SCHEDULE WITH pg_cron
-- =============================
-- Daily at 03:00 UTC: expire + enqueue reminders
select cron.schedule(
  'expire-showcases-daily',
  '0 3 * * *',
  $$select public.expire_due_showcases();$$
);

select cron.schedule(
  'enqueue-expiry-reminders-daily',
  '5 3 * * *',
  $$select public.enqueue_expiry_reminders();$$
);
