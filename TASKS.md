# TASKS.md

Pendientes del proyecto. Armado el 6/10/2026 a partir del repo (último push 1/10), los docs y la QA del 30/9-1/10. Lo marcado "sin verificar" no se probó en la app logueada.

## Último check / próximo paso

- **Fecha:** 2026-10-13
- **Último check:** completados el **bloque F** (deuda de lint: 13 errores → 0; quedan 34 warnings pre-existentes) y el **bloque D** (import CSV/XLSX, export CSV/XLSX, Wall of Love público, y 4 variantes de widget de testimonials). Verificado con `pnpm lint` (0 errores), `pnpm exec tsc --noEmit` y `pnpm build` OK; smoke test de `/wall/[slug]` (200 con branding) y `/w/t/[publicKey]?variant=` (200 en las 4 variantes; el estado vacío es lo único que se pudo ver porque no hay testimonios approved+public en la DB). **Sin migraciones SQL nuevas**: el schema ya soportaba todo. No se probó el render con testimonios reales ni el import end-to-end (falta data).
- **Próximo paso:** sigue pendiente el **bloque B** (config): ver qué migraciones están aplicadas en cloud y correr la 023, `NEXT_PUBLIC_APP_URL` en Vercel, Site URL de Supabase Auth. Después **Paddle P0** (firma del webhook). Probar import/export/Wall/widgets con testimonios reales.
- (Actualizar esta sección al cerrar cada sesión: fecha, qué se hizo, qué sigue.)

## Orden sugerido

1. Config sin código (15 min): confirmar en Supabase qué migraciones están aplicadas (020-022 y 001-019); aplicar la migración 023; corregir Site URL; fijar `NEXT_PUBLIC_APP_URL` en Vercel.
2. Fixes chicos de UX/analytics (bloque A abajo) — A.2 a A.5 ya están en código; A.1 es diagnóstico de config.
3. Paddle P0, firma del webhook, antes de activar cualquier plan.
4. Brechas de testimonials vs Senja, en el orden del bloque D.
5. Documentar con AGENTS.md + este archivo y mantenerlos al día.

## A. Bugs de producto

| Estado | Tarea |
|---|---|
| Abierto (config) | Analytics "Signups from page" queda en 0 — sin fix de código, es config/datos. Hipótesis: (a) los eventos anteriores a la migración 021 quedaron con `source='legacy'` y el dashboard solo cuenta `source='hosted'` — se cura solo con signups nuevos; (b) el subscribe atribuye `hosted` solo si `origin`/`referer` matchean `NEXT_PUBLIC_APP_URL` — si la app corre en waitlist.leovenezia.dev pero la env var apunta al dominio vercel.app, todo cae en `api`. Ver checklist B, pasos 4-5 (env var en Vercel + query de eventos por `source`). |
| Resuelto en repo (6/10) | Contadores del form de testimonials (VISITS, RESPONSE RATE) en 0. Causa: la policy RLS de `testimonial_form_visits` (migración 018) joineaba `projects.id = form_id` (debía ir vía `testimonial_forms.project_id`). Fix: migración 023 creada — falta aplicarla en cloud (checklist B, paso 2). INVITES en 0 puede ser legítimo si nunca se enviaron invites. |
| Resuelto en código (6/10) | Preview del form decía "Step 1 of 6" con 8 pasos reales. Causa: la card de la lista (`testimonials/forms/page.tsx`) no pasaba `wizard` a `FormPreviewFrame`, así que los pasos private/consent no aparecían. Fix: parsear `design` y pasar `wizard`. Bonus: el editor ahora usa `variant="editor"`. |
| Resuelto en código (6/10) | Mensaje de URL inválida duplicado: se mostraba inline (input Website) y en el `<p role="alert">` global. Fix: el global excluye `invalidField === "website"` y se unificaron los dos textos de validación en uno. |
| Resuelto en código (6/10) | Signup no avisaba "revisá tu mail": `signUp` redirigía siempre a /dashboard aunque no hubiera sesión (Confirm email ON). Fix: si `!data.session` devuelve `{ checkEmail, email }` y el form muestra "Check your email"; además `emailRedirectTo` ahora preserva el `next`/claim. Verificar con Confirm email ON (checklist B, paso 6). |

## B. Config / infra

| Estado | Tarea |
|---|---|
| Pendiente (manual) | Verificar qué migraciones están aplicadas en la DB cloud (020-022 y 001-019; en el repo no existe 006 — salta de 005 a 007). Aplicar la migración 023 (fix de la policy de `testimonial_form_visits`) — está escrita en el repo, falta correrla en cloud. |
| Pendiente (manual) | Vercel: `NEXT_PUBLIC_APP_URL` = `https://waitlist.leovenezia.dev` (Production). Probable causa de A.1: si apunta al dominio vercel.app, los signups de la página caen en `source='api'`. Redeploy tras el cambio. |
| Abierto | Site URL de Supabase Auth: el link de confirmación redirige a waitlist-nine-pink.vercel.app en vez de waitlist.leovenezia.dev. Configurar Site URL y Redirect URLs (`/auth/callback`). |
| Abierto | Mails de confirmación: branding propio. Con Confirm email ON, decidir ese setting; si el volumen crece, SMTP custom con Resend (el built-in de Supabase tiene rate limit muy bajo). |
| Pendiente | Vercel: env vars de Paddle (client token, price Launch y Grow, webhook secret, API key si se usa). |
| Dejado a propósito | Turnstile apagado, rate limit en memoria. Revisar antes de abrir al público. |

## C. Paddle (ver PADDLE.md)

| Prioridad | Estado | Tarea |
|---|---|---|
| P0 | Abierto | Verificar firma criptográfica del webhook (raw body, header, secreto, timestamp). Tests: válida, firma errónea, body alterado, timestamp vencido. Sin bypass en producción. Bloquea cobros. |
| P1 | Abierto | Downgrade a Free al terminar el período. Decisión tomada (6/10): solo suscripciones canceladas (`cancel_at_period_end`/`canceled`) con `current_period_end` vencido bajan; past_due/paused conservan el plan mientras Paddle reintenta. Patrón a usar: pg_cron + función plpgsql (como la migración 013). Falta definir overflow de subscribers (candidato: `pending_unlock`) y showcase (pasa a expiración de 1 año). |
| P2 | Abierto | Idempotencia de eventos y conflicto por `paddle_transaction_id`. |
| P3 | Abierto | Confirmar entorno sandbox en Paddle.js y probar checkout sandbox. |

## D. Testimonials vs Senja

Meta de Leo: que nadie vea necesario pasarse a Senja. Mínimo para paridad, por impacto:

1. Import de testimonials *(hecho 13/10)* — archivo CSV/XLSX en `/dashboard/projects/[id]/testimonials/import` (parseo en cliente con `xlsx`). Entran `approved` + `consent='public'` con `consent_confirmed_by/at`. Entrada también en el sidebar (sección Testimonials).
2. Widgets distintos *(hecho 13/10)* — 4 variantes: `grid`, `carousel`, `marquee`, `quote`. Se eligen en Integration → tab **Testimonials**; la ruta `/w/t/[publicKey]?variant=` las sirve (`src/lib/testimonials/widget-html.ts`). Config en `projects.settings.testimonial_widget`.
3. Wall of Love *(hecho 13/10)* — página pública `/wall/[slug]` con todos los approved + public (masonry, branding para Free). Link en el header de Testimonials y en Integration.
4. Export de testimonials *(hecho 13/10)* — CSV/XLSX en `/api/projects/[id]/testimonials/export` (filtra por status/form), botones en el header de Testimonials.
5. Búsqueda por texto y tags (filtros por estado y form ya existen en la lista de testimonials).
6. Video testimonials, moderación por lote, notificación al owner, métricas por paso.

Nota de gating: import/wall/widgets quedaron sin límite por plan (decisión pendiente de Leo). El único límite activo es `remove_branding` (branding en Wall/widget para Free).

Ojo con JSON-LD: Google no muestra estrellas para reseñas autopromocionales vía widgets propios. No prometer "estrellas en Google".

## E. Decisiones de Leo (no son tareas de código)

- Nombre del producto (hoy: Startpack / [PACK] en el repo, "Startups Army" en la app, "LaunchList" en `.env.example` y `launchlist.html`).
- Pricing final (plans.ts: Free, Launch $9, Grow $29; PRODUCT.md y plans.ts deben coincidir).
- Foco: software founders vs marcas ecommerce DTC (una landing por vertical, mismo dominio).
- Envío de mails fríos: Zoho limitó la cuenta de leovenezia.dev; hay que repensar el canal.

## F. Deuda técnica

- *(Resuelto 13/10)* Lint en 0 errores. Eran 11 `no-explicit-any` (`showcases/[id]/actions.ts` ×7, `showcases/[id]/showcase-form.tsx` ×2, `paddle-init.tsx` ×2) y 2 de `react-hooks` (`public-waitlist-form.tsx` inmutabilidad de `window`, `page.tsx` con `Date.now()` en render). Fixes: updates de showcases tipados con `Database[...]["showcases"]["Update"]`; `catch (e: unknown)` + narrowing; helpers de módulo para los globals de Turnstile; `thisWeekCutoff()` fuera del componente. Quedan **34 warnings** (`no-img-element` y un par de `no-unused-vars`) que no rompen el lint; no se tocaron.

## Hecho

**Hasta 1/10:** Detalle de testimonial con editor, badges y Reject, validación de Website, header mobile, Thank You, /projects/new, migración 020 (se retira el SELECT anónimo a testimonials), docs sincronizados.

**6/10:** Revisión de AGENTS.md y TASKS.md; fixes de bugs A.2-A.5 (migración 023, preview de pasos, error de URL duplicado, pantalla "Check your email") con `tsc`/`build` OK y smoke test de páginas públicas.

**13/10:** Bloque D completo — import de testimonials (CSV/XLSX), 4 variantes de widget (+ tab Testimonials en Integration), Wall of Love público (`/wall/[slug]`), export CSV/XLSX. Bloque F resuelto — `pnpm lint` en 0 errores (11 `any` + 2 react-hooks). Sin migraciones SQL nuevas. `tsc`/`build` OK, smoke test de rutas públicas nuevas.

## Data API grants (Supabase, change from 2026-10-30)

Migration: `supabase/migrations/024_explicit_data_api_grants.sql` (grant-only, idempotent). Check afterwards in the SQL editor:

```sql
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated', 'service_role')
group by 1, 2 order by 1, 2;

select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;
```

Every table must show rowsecurity = true. anon should only have SELECT on projects, showcases, testimonial_forms, testimonials and INSERT on testimonials.
