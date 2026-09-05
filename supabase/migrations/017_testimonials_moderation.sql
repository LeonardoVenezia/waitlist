-- Migration 017: Testimonials moderation + answers
--
-- 1. `answers` jsonb on testimonials: stores the responses to the custom
--    questions defined in the testimonial form (previously rendered but
--    never persisted).
-- 2. `moderation` on testimonial_forms: 'manual' (default) puts public
--    submissions in 'pending' until the project owner approves them;
--    'auto' publishes them immediately.
-- 3. Drops the "Anyone can insert testimonials" RLS policy. Public submits
--    go exclusively through /api/testimonials/submit (service role), which
--    applies IP rate limiting, Turnstile validation, and form checks.
--    Direct anon-key inserts were an unrate-limited spam vector.

alter table public.testimonials
  add column if not exists answers jsonb not null default '{}'::jsonb;

alter table public.testimonial_forms
  add column if not exists moderation text not null default 'manual'
    check (moderation in ('manual', 'auto'));

drop policy if exists "Anyone can insert testimonials" on public.testimonials;
