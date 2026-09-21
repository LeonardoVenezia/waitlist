-- Wizard de testimonials: campos nuevos del flujo de recolección.
--   consent          -> consentimiento de uso elegido por el autor (public/private).
--   private_feedback -> nota privada que no se comparte públicamente.
--   website          -> sitio web de la empresa del autor (paso "About your company").
--   company_logo_url -> logo de la empresa (path en el bucket showcase-images).
-- avatar_url (foto del autor) ya existe desde 011.
alter table public.testimonials
  add column if not exists consent          text check (consent in ('public', 'private')),
  add column if not exists private_feedback text,
  add column if not exists website          text,
  add column if not exists company_logo_url text;

-- The author photo is part of the default field set for new forms.
alter table public.testimonial_forms
  alter column fields set default '["name", "email", "message", "rating", "photo"]';
