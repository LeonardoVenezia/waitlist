# Contexto técnico — Startpack

> Revisado: 2026-10-01. Este documento describe el código del repositorio, no confirma el estado de producción ni de la base cloud.
> Producto: suite Startpack para founders. Repo Next.js en Vercel; Supabase para auth, Postgres y storage.

## Cómo usar este documento

- Es la guía de onboarding técnico para retomar el trabajo en una sesión nueva.
- `PRODUCT.md` es la referencia de capacidades/planes desde la experiencia del producto.
- `DESIGN.md` documenta el lenguaje visual.
- `PRODUCTION.md` y `PADDLE.md` son runbooks operativos; `CHANGELOG.md` es histórico, no fuente del estado actual.
- Si el código y estos docs divergen, verificar código + migraciones y actualizar el documento correspondiente.

## Producto y modelo actual

Startpack combina el directorio público de productos con herramientas por proyecto: showcase, waitlist/referrals, landing builder y testimonials. La tabla principal es `projects` (el nombre `waitlists` quedó en historial/migraciones antiguas). Un proyecto tiene showcase y waitlist; testimonials y el builder usan el mismo `project_id`.

Planes mensuales por proyecto (`src/lib/plans.ts`):

| Plan | Precio en código | Límite de waitlist | Capacidades distintivas |
|---|---:|---:|---|
| Free | $0 | 100 | Page builder básico, widget, export; showcase expira al año; atribución Startpack en widgets |
| Launch | $9/mes | 1.000 | Templates, double opt-in, Slack notifications; showcase sin expiración |
| Grow | $29/mes | 10.000 | Team/webhooks/Zapier/custom domain, remove branding y otras funciones definidas en `FEATURE_MATRIX` |

Los precios/IDs de Paddle dependen de env vars y configuración externa. Para la matriz exacta de gating consultar `src/lib/plans.ts`; no inferir funciones por el nombre comercial del plan.

## Stack y comandos

- Next.js 16.2 / App Router, React 19, TypeScript 5.
- Supabase JS + SSR: auth, Postgres, storage; Tailwind CSS v4; Recharts para analytics.
- Resend vía REST (`src/lib/email.ts`), Paddle para suscripciones, Cloudflare Turnstile (apagado actualmente por constante).
- Scripts comprobados en `package.json`:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm start`
  - `pnpm lint`
  - Typecheck: `pnpm exec tsc --noEmit`
- No hay runner de tests propio configurado en `package.json` al revisar este documento.
- Variables de ejemplo: `.env.example`. `NEXT_PUBLIC_SITE_URL` no se usa en el código revisado; la URL pública se construye desde `NEXT_PUBLIC_APP_URL`.

## Rutas públicas

| Ruta | Función |
|---|---|
| `/` | Directorio/home |
| `/products`, `/launches`, `/coming-soon` | Listados de showcases |
| `/product/[slug]` | Ficha de producto; testimonials aprobados solo con consentimiento público explícito |
| `/p/[slug]` | Waitlist hosteada: template, builder de secciones o fallback clásico |
| `/t/[formSlug]` | Formulario de testimonials; un formulario archivado presenta estado cerrado |
| `/t/[formSlug]/embed` | Variante iframe del formulario |
| `/w/e/[publicKey]` | Widget de waitlist |
| `/w/e/[publicKey]/leaderboard` | Leaderboard embebible |
| `/w/t/[publicKey]` | Widget de testimonials, proyección pública acotada |
| `/login`, `/signup`, `/auth/callback` | Autenticación |

Los testimonials no se muestran en Coming soon ni en `/p`; se muestran en la ficha de producto lanzado y se pueden insertar como widget externo desde Integration.

## Dashboard

Rutas bajo `/dashboard/projects/[id]`:

- Overview, subscribers, analytics, export, settings y upgrade.
- `page-builder`: landing de waitlist con secciones custom o templates.
- `integration`: configuración/instalación de widget y leaderboard; preview de testimonials.
- `thank-you`: configuración del copy clásico y preview real; campos sin consumidor fueron retirados de la UI, sin borrar de golpe config histórica.
- `testimonials`: listado/moderación, detalle editable, forms e invites.
- `/dashboard/showcases/[id]`: edición/publicación del producto del directorio.
- `/admin/claims`: gestión de claims de showcases seeded.

## Datos y flujos

### Modelo principal

Tablas relevantes definidas en SQL base/migraciones: `profiles`, `accounts`, `account_members`, `projects`, `subscribers`, `purchases`, `subscriptions`, `page_events`, `showcases`, `testimonial_forms`, `testimonials`, `testimonial_form_visits`, `testimonial_invites`, `email_queue` y claims. Consultar `supabase/migrations/` para esquema vigente; `src/lib/supabase/types.ts` es el snapshot tipado del cliente, no reemplaza la verificación de la DB.

### Waitlist

- Alta pública: `/api/public/subscribe`; valida proyecto/public key, email, disposable domains, rate limit y configuración de plan; crea referral code, calcula posición y despacha emails/avisos.
- El exceso del límite se conserva como `pending_unlock`; la activación depende del flujo de plan.
- Referral codes se usan con `?ref=CODE`; el contador se incrementa vía RPC.
- Widgets de signup usan iframe (`public/widget.js` → `/w/e/[publicKey]`).
- Analytics hosted filtra eventos `source='hosted'`; referer/origin se usa para atribuir, no es una prueba criptográfica resistente a falsificación. Eventos anteriores a la columna `source` quedan `legacy` y no se reatribuyen.

### Page Builder / Thank You

- `settings.page_sections` almacena `template_id`, `template_data`, secciones y globales.
- Un template activo sustituye el renderer de secciones. `src/lib/templates.ts` y `src/components/templates/template-renderer.tsx` son las fuentes centrales de registro/normalización/render.
- La confirmación post-signup pertenece al template activo; el copy editable de `settings.thank_you` aplica a la pantalla clásica cuando no hay template.
- `thank_you` conserva claves históricas que ya no tienen controles/consumidores. No volver a prometer su efecto sin conectar salida real.

### Testimonials y privacidad

- El formulario recoge rating/mensaje, preguntas custom (`answers`), contacto/perfil, feedback privado y opción de uso `public`/`private` cuando está habilitada.
- Envíos públicos pasan por `/api/testimonials/submit`, que valida el form publicado y valida website HTTP(S); el consentimiento es requerido si el formulario tiene `ask_consent`.
- Moderación: `pending`, `approved`, `rejected`; se puede destacar. Dashboard detail deja revisar campos privados y editar nombre/empresa/cargo/mensaje.
- Publicación: solo `approved` + `consent='public'`. `private` y `null` no se publican; la ficha y widget consultan server-side una allowlist de columnas.
- Un `null` legacy solo puede publicarse tras una confirmación explícita del propietario de que ya obtuvo permiso. Se guarda `consent_confirmed_by/at`; una elección `private` del autor no se cambia por ese control.
- La migración 020 elimina SELECT anónimo directo de `testimonials`. El service role no se expone al cliente; endpoints/render público lo usan solo en servidor.

## Seguridad: patrones y límites confirmados

- Server components/authenticated reads: `createClient()` con RLS.
- Admin writes con service role: verificar ownership con lectura RLS previa (patrón en `src/lib/testimonials/actions.ts` y otras actions). El service role nunca va en `NEXT_PUBLIC_*`.
- Formularios públicos escriben vía API server-side, no insert anónimo directo.
- `TURNSTILE_ENABLED` está en `false` en `src/lib/turnstile.ts`: CAPTCHA no se renderiza ni valida aunque existan claves. Para activarlo hay que cambiar la constante y configurar las dos env vars.
- Rate limit es in-memory; no es distribuido y no equivale a control robusto multi-instancia.
- **Paddle webhook es un riesgo crítico abierto**: `readVerifiedPayload()` solo comprueba presencia de `paddle-signature` si existe `PADDLE_WEBHOOK_SECRET`; no valida criptográficamente el valor. Sin secret permite JSON sin verificar (modo dev). No habilitar cobros en producción hasta implementar y probar la verificación oficial de Paddle. Ver `PADDLE.md`.

## Migraciones / estado cloud

- Migraciones SQL se mantienen en `supabase/migrations/` y se aplican manualmente en Supabase SQL Editor (preferencia del proyecto).
- El repo contiene migraciones hasta `022` en esta revisión. **No se verificó la versión aplicada en la base cloud**; no asumir que repo == producción.
- Para el trabajo reciente de testimonials, aplicar en orden `020_testimonial_public_access.sql`, `021_page_event_sources.sql`, `022_testimonial_consent_confirmation.sql` antes de deploy:
  1. 020 retira lectura pública directa de la tabla `testimonials`.
  2. 021 añade `page_events.source`, default `legacy`.
  3. 022 añade actor/fecha de confirmación de consentimiento legacy.
- No se aplicaron desde este agente. Comprobar primero estado de columnas/policies en Supabase para evitar duplicar modificaciones manuales.

## Emails y jobs

- Emails salen server-side con `EMAIL_FROM`; envíos encolados usan `/api/cron/dispatch-emails`, protegido por `Authorization: Bearer <CRON_SECRET>` y procesa hasta 50 filas por lote.
- `email_queue` incluye invitaciones a testimonials y emails de claims/lifecycle. Branding de email se resuelve en `src/lib/email-brand.ts`.
- Expiración/reminders dependen de migraciones/jobs Supabase (`013`, `014`) y del cron dispatcher. Verificar extensiones/jobs en el dashboard Supabase/Vercel; el código local no prueba que estén configurados en producción.

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `src/lib/plans.ts` | Planes y feature gating |
| `src/lib/supabase/{server,admin,client}.ts` | Clientes Supabase; separar RLS/admin |
| `src/lib/supabase/types.ts` | Tipos DB usados en app |
| `src/lib/templates.ts` | Registro/defaults/normalización templates |
| `src/components/templates/template-renderer.tsx` | Render compartido de templates |
| `src/lib/testimonials/actions.ts` | Actions de forms, moderación, edición/invites |
| `src/app/api/testimonials/submit/route.ts` | Boundary de envío público testimonial |
| `src/app/(public)/product/[slug]/product-testimonials.tsx` | Testimonials en ficha lanzada |
| `src/app/w/t/[publicKey]/route.ts` | Widget testimonial allowlisted |
| `src/app/dashboard/projects/[id]/analytics/page.tsx` | Cálculo de métricas |
| `src/app/api/webhooks/paddle/route.ts` | Webhook con verificación pendiente |
| `src/lib/email.ts`, `src/lib/email-brand.ts` | Envío y branding email |
| `src/lib/turnstile.ts` | Kill switch Turnstile |
| `public/widget.js` | Loader de embeds waitlist/testimonials |
| `supabase/migrations/` | Evolución SQL manual |

## Cómo retomar

1. Leer este archivo y `PRODUCT.md`/`PRODUCTION.md` según la tarea.
2. Revisar `git status` y el código de las rutas relevantes; este contexto no sustituye el estado actual del repo.
3. Para DB, inspeccionar migraciones + estado cloud. No ejecutar SQL de migraciones pendientes sin comprobar qué se aplicó.
4. Para cambios de seguridad, revisar los límites service role/RLS y qué datos salen por ruta pública.
5. Validar con `pnpm exec tsc --noEmit` y `pnpm build`; `pnpm lint` existe, pero al 2026-10-01 falla por errores preexistentes en archivos de showcase, Turnstile y home. Volver a correrlo antes de asumir que siguen iguales.
