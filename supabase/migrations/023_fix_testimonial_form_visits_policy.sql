-- Migration 023: Fix owner read policy on testimonial_form_visits.
--
-- 018 created the select policy joining projects.id = form_id, but form_id
-- references testimonial_forms.id, not projects.id — so owners could never
-- read visit rows and the form dashboard counters (visits, response rate)
-- always showed 0. This migration recreates the policy joining through
-- testimonial_forms.project_id.

drop policy if exists "Owners can view form visits" on public.testimonial_form_visits;

create policy "Owners can view form visits"
  on public.testimonial_form_visits for select
  using (
    exists (
      select 1
      from public.testimonial_forms tf
      join public.projects p on p.id = tf.project_id
      join public.account_members am on am.account_id = p.account_id
      where tf.id = testimonial_form_visits.form_id
        and am.user_id = auth.uid()
    )
  );
