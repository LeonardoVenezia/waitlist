# Contexto del Proyecto — Startpack

> Actualizado: 2026-08-22
> Stack: Next.js 16 + Supabase + shadcn/ui + Tailwind CSS v4
> Dominios: `https://waitlist.leovenezia.dev` (producción) · `https://waitlist-nine-pink.vercel.app` (preview)

---

## El producto

**Startpack** es una suite de herramientas para founders/indie hackers. El núcleo actual es el **showcase / directorio de productos**: la home es el directorio, y cada proyecto puede publicar una ficha de producto con nombre, descripción, categorías, imágenes, video y link.

Sobre ese núcleo se integran dos herramientas más:

- **Waitlist viral con referidos** (`/p/[slug]` + widget embebible)
- **Testimonials** (`/t/[formSlug]` + sección en la ficha de producto)

Cada proyecto es una unidad independiente con su propio plan. Los planes son de pago **único por proyecto** vía Paddle:

- **Free** — $0, 150 submissions
- **Launch** — $29, 500 submissions
- **Grow** — $79, 10.000 submissions

La idea de negocio es que un fundador paga una vez y desbloquea todas las herramientas actuales y futuras para ese proyecto.

---

## Stack técnico

| Capa | Tecnología | Variables de entorno |
|---|---|---|
| Frontend + Backend | Next.js 16 (App Router, React 19, RSC, Server Actions) | `NEXT_PUBLIC_APP_URL` |
| UI | shadcn/ui + Tailwind CSS v4 | — |
| BD + Auth + Storage | Supabase (Postgres) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Pagos | Paddle (one-time) | `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRICE_LAUNCH`, `PADDLE_PRICE_GROW` |
| Anti-bot | Cloudflare Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| Email | Resend (API REST directa, sin SDK) | `RESEND_API_KEY`, `EMAIL_FROM` |
| Fonts | Geist (body) + Italiana (headings) | — |

---

## Cuentas e infraestructura

- **Supabase**: proyecto `dxgxbugfjxzgvqzsjgff`
- **Vercel**: proyecto `waitlist-nine-pink`; dominio custom `waitlist.leovenezia.dev`
- **Paddle**: vendedor `LeoVenezia Studios`
- **Resend**: dominio `leovenezia.dev` verificado; remitente `EMAIL_FROM="Startpack <hola@leovenezia.dev>"`
- **Cloudflare**: zona `leovenezia.dev` gestionada por Cloudflare; subdominio `waitlist` proxied hacia Vercel

---

## Rutas principales

### Públicas

| Ruta | Descripción |
|---|---|
| `/` | Directorio de productos |
| `/product/[slug]` | Detalle de producto del directorio |
| `/products` | Listado de productos |
| `/launches` | Lanzamientos recientes |
| `/coming-soon` | Productos por lanzar |
| `/p/[slug]` | Página hosteada de waitlist (SSR, con page builder o template) |
| `/t/[formSlug]` | Formulario público de testimonios |
| `/login`, `/signup` | Auth |
| `/auth/callback` | Callback OAuth Supabase |

### API públicas

| Ruta | Método | Descripción |
|---|---|---|
| `/api/public/waitlist/[publicKey]` | GET | Config pública de waitlist |
| `/api/public/subscribe` | POST | Registro de suscriptor (Turnstile, rate limit, referidos, email) |
| `/api/public/subscriber` | PATCH | Respuestas post-signup |
| `/api/public/position` | GET | Posición actual y referral_count |
| `/api/public/verify` | GET | Verificación de email (double opt-in) |
| `/api/public/pageview` | POST | Track de page views |
| `/api/testimonials/submit` | POST | Submit de testimonios |
| `/api/webhooks/paddle` | POST | Webhook de Paddle |

### Dashboard

| Ruta | Descripción |
|---|---|
| `/dashboard` | Overview |
| `/dashboard/projects` | Lista de proyectos |
| `/dashboard/projects/new` | Crear proyecto |
| `/dashboard/projects/[id]` | Detalle del proyecto |
| `/dashboard/projects/[id]/settings` | Branding, hero, thank-you, submissions, post-signup, email, notifications, team, block |
| `/dashboard/projects/[id]/page-builder` | Page builder + selector de templates |
| `/dashboard/projects/[id]/integration` | Widget, custom form, leaderboard |
| `/dashboard/projects/[id]/subscribers` | Gestión de suscriptores |
| `/dashboard/projects/[id]/analytics` | Analíticas |
| `/dashboard/projects/[id]/export` | Export CSV/XLSX |
| `/dashboard/projects/[id]/upgrade` | Checkout Paddle |
| `/dashboard/projects/[id]/testimonials` | Testimonios del proyecto |
| `/dashboard/showcases/[id]` | Directorio/showcase del proyecto |

---

## Base de datos

Tabla principal renombrada de `waitlists` a **`projects`** (migración `010`).

### Tablas

- **`profiles`** — 1:1 con `auth.users`, creada por trigger
- **`accounts`** — backbone multi-producto
- **`account_members`** — miembros de equipo
- **`projects`** — proyecto (waitlist + showcase + testimonials); incluye `settings` JSONB
- **`subscribers`** — suscriptores con `referral_count` denormalizado
- **`purchases`** — auditoría de transacciones Paddle
- **`page_events`** — views y signups de páginas hosteadas
- **`showcases`** — entradas del directorio
- **`testimonial_forms`** — formularios de testimonios
- **`testimonials`** — testimonios recolectados

### RLS

- **`createClient()`** — cliente RLS para lecturas autenticadas
- **`createAdminClient()`** — service role para escrituras; siempre verificar ownership con una lectura RLS antes del write
- Endpoints públicos usan service role con validación manual

### Funciones/triggers

- `get_position(subscriber_id)` — posición por `ROW_NUMBER()`
- `increment_referral_count(subscriber_id)` — incremento atómico
- `handle_new_user()` / `on_auth_user_created` — crea profile + account + member al registrarse

---

## Loop de referidos

1. Cada signup genera `referral_code` único
2. `?ref=CODE` identifica al referidor
3. Se inserta subscriber con `referred_by` y se incrementa `referral_count`
4. Posición calculada al leer
5. Leaderboard muestra top N con emails enmascarados

---

## Anti-spam

- Cloudflare Turnstile (implícito en la página hosteada)
- Lista de emails desechables
- Rate limit in-memory (no apto multi-instancia)
- Validación de formato y MX lookup

---

## Email (Resend)

Envío server-side en `src/lib/email.ts` con `fetch` directo a `https://api.resend.com/emails`.

Emails implementados:

- Welcome al suscriptor (según plan y settings)
- Notificación de signup al owner
- Verificación de email (double opt-in)
- Milestone de referidos

Configuración por proyecto guardada en `settings.email` y parseada por `src/lib/email-settings.ts`. Remitente global vía `EMAIL_FROM`.

---

## Widget

`public/widget.js` monta el widget de waitlist dentro de un iframe usando el selector `.startpack-widget[data-key-id]`.

- El iframe apunta a `/w/e/[publicKey]`.
- `settings.widget.mode` define el origen:
  - `"custom"`: formulario genérico configurable (`settings.widget`).
  - `"template"`: usa el template activo del Page Builder (`settings.page_sections.template_id`).
- Si hay un template activo y `mode === "template"`, `/w/e` redirige a la página pública en modo embebido (`?embed=1`).
- Los proyectos Free muestran un backlink dofollow "Made with Startpack" al pie del widget custom. Los planes pagos no lo muestran.
- El preview de Integration usa las mismas fuentes de render que producción:
  - Custom: `buildWidgetHtml` en un `iframe srcDoc`.
  - Template: `TemplateRenderer` con `embedded`.
- El snippet correcto se genera en **Integration** (`/dashboard/projects/[id]/integration`).

---

## Page Builder y templates

`settings.page_sections` contiene:

```json
{
  "template_id": "neon" | "carbon" | "pastel" | null,
  "template_data": { ... },
  "sections": [ ... ],
  "global": { ... }
}
```

- Si `template_id` es válido, la página pública ignora `sections` y renderiza el template.
- Templates disponibles solo para planes pagos (`hasTemplateAccess`).
- La elección es reversible: elegir "Custom builder" restaura el editor de secciones.
- `src/lib/templates.ts` define tipos, defaults y normalización.
- `src/components/templates/template-renderer.tsx` es la **única fuente** de layout/switch de templates, usada tanto por la página pública como por el preview del Page Builder.

---

## Planes y gating

Archivo: `src/lib/plans.ts` (antes `plan-gates.ts`).

`hasFeature(plan, feature)` para features por plan. `FeatureGate` en `src/components/shared/feature-gate.tsx` para UI con candado. Templates usan `hasTemplateAccess(plan)` en `src/lib/templates.ts`.

---

## Limitaciones y pendientes

- **Rate limit in-memory**: no funciona en multi-instancia. Migrar a Redis/Upstash.
- **Paddle webhook**: la firma no está verificada todavía.
- **Turnstile en widget iframe**: el widget embebido no envía Turnstile.
- **`verify-token.ts`** usa `SUPABASE_SERVICE_ROLE_KEY` como secret; ideal sería una env propia.
- **i18n**: el widget y la página hosteada no usan el idioma configurado.
- **Team UI**: `account_members` existe pero la gestión es parcial.
- **Webhooks + Zapier**: configuración de webhooks personalizados (plan Grow).

---

## Cómo levantar en local

```bash
pnpm dev
# requiere .env.local con todas las variables
```

## Cómo deployar

Push a `main` → Vercel deploya automáticamente. Env vars en Vercel → Settings → Environment Variables.

---

## Archivos clave

| Archivo | Propósito |
|---|---|
| `supabase/schema.sql` | Esquema base (usa nombre `waitlists`) |
| `supabase/migrations/` | Migraciones aplicadas manualmente |
| `src/lib/supabase/types.ts` | Tipos TypeScript para BD |
| `src/lib/plans.ts` | Planes y feature gating |
| `src/lib/templates.ts` | Tipos, defaults y validación de templates |
| `src/lib/email-settings.ts` | Parseo de `settings.email` |
| `src/lib/email.ts` | Envío Resend |
| `src/lib/api/cors.ts` | CORS para endpoints públicos |
| `src/lib/api/verify-token.ts` | Tokens de verificación de email |
| `src/lib/api/rate-limit.ts` | Rate limiter in-memory |
| `src/lib/api/referral-code.ts` | Generación de referral codes |
| `src/lib/api/position.ts` | Posición y conteo de suscriptores |
| `src/lib/api/leaderboard.ts` | Leaderboard |
| `src/lib/api/slack.ts` | Notificaciones Slack |
| `src/lib/api/validate-turnstile.ts` | Validación Turnstile |
| `src/lib/disposable-emails.ts` | Dominios desechables |
| `src/components/templates/` | Templates de waitlist + renderer |
| `src/components/shared/feature-gate.tsx` | Candado por plan |
| `src/components/shared/paddle-init.tsx` | Inicialización Paddle |
| `src/proxy.ts` | Proxy de sesión |
| `public/widget.js` | Widget embebible |
| `src/app/p/[slug]/public-waitlist-form.tsx` | Formulario de página hosteada |
| `PRODUCT.md` | Visión de producto |
| `PRODUCTION.md` | Guía de salida a producción |
| `DESIGN.md` | Sistema de diseño |
| `CHANGELOG.md` / `CHANGELOG.es.md` | Historial de cambios |
