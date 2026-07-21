# Changelog — Waitlist by [PACK]

## Rutas construidas (23)

```
ƒ /                          Landing page (redirige a /dashboard si ya tiene sesión)
ƒ /auth/callback             Callback de OAuth
ƒ /login                     Inicio de sesión (email/contraseña + Google)
ƒ /signup                    Registro
○ /pricing                   Página de precios
ƒ /p/[slug]                  Página hosteada de waitlist (SSR)
ƒ /dashboard                 Vista general del dashboard
ƒ /dashboard/waitlists       Lista de waitlists
ƒ /dashboard/waitlists/new   Crear waitlist
ƒ /dashboard/waitlists/[id]          Detalle de waitlist
ƒ /dashboard/waitlists/[id]/settings Formulario de configuración
ƒ /dashboard/waitlists/[id]/subscribers Tabla de suscriptores
ƒ /dashboard/waitlists/[id]/analytics Analíticas
ƒ /dashboard/waitlists/[id]/embed    Código para embeber
ƒ /dashboard/waitlists/[id]/export   Página de exportación
ƒ /dashboard/waitlists/[id]/upgrade  Upgrade / checkout Paddle
ƒ /dashboard/settings/purchases      Historial de compras
ƒ /dashboard/sign-out                Cerrar sesión
ƒ /api/public/waitlist/[publicKey]   Config del widget (GET)
ƒ /api/public/subscribe              Endpoint de registro (POST)
ƒ /api/public/position               Consulta de posición (GET)
ƒ /api/public/verify                 Verificación de email (GET)
ƒ /api/waitlists/[id]/export         Export CSV/XLSX (GET)
ƒ /api/webhooks/paddle               Webhook de Paddle (POST)
ƒ Proxy (Middleware)                 Refresco de sesión Supabase
```

## Hito 1 — Scaffold + Base de datos

- Next.js 16 (App Router, Turbopack, dir src/) + Tailwind 4 + shadcn/ui
- Supabase: `client.ts`, `server.ts`, `admin.ts`, `proxy-session.ts` (reemplaza middleware deprecado)
- Auth: email/contraseña + Google OAuth, server actions con `useActionState`, callback handler
- Landing page, pricing page, páginas de login/registro
- Shell del dashboard: sidebar con patrón de registro de productos, menú de usuario (compras, cerrar sesión)
- CRUD de waitlist: formulario de creación con validación de slug, página de detalle con stats
- Schema SQL (`supabase/schema.sql`): 6 tablas (profiles, accounts, account_members, waitlists, subscribers, purchases), políticas RLS, trigger de auto-creación al registrarse (profile + account + account_membership), función `get_position`, función `increment_referral_count`

## Hito 2 — CRUD de Waitlist + Configuración

- Formulario de configuración con acción de guardar: branding (nombre, slug, logo, color), hero (título, subtítulo, CTA), formulario (colectar nombre), thank-you page (mensaje, toggles de posición/referido/leaderboard), referidos (activado, posiciones por referido, texto de recompensa), notificaciones (email al registrarse, webhook Slack), idioma
- API pública:
  - `GET /api/public/waitlist/:publicKey` — devuelve config (branding, campos del form)
  - `POST /api/public/subscribe` — flujo completo: validación Turnstile → formato email → domino desechable → rate limiting por IP → generación de código de referido → loop de referidos (incremento del contador desnormalizado) → gating por límite de plan (status `hidden`) → cálculo de posición → leaderboard
  - `GET /api/public/position?public_key=&code=` — refrescar posición + contador de referidos
  - `GET /api/waitlists/[id]/export?format=csv|xlsx` — exportar suscriptores activos

## Hito 3 — Loop de Referidos + Motor de Posición

- Posición calculada en tiempo de lectura: `ROW_NUMBER() OVER (ORDER BY referral_count DESC, created_at ASC)`
- Código de referido: nanoid(8) con reintento en caso de colisión
- `referral_count` desnormalizado en subscriber, incrementado atómicamente vía SQL `increment_referral_count()`
- Leaderboard: top N suscriptores ordenados por referral_count DESC, created_at ASC
- Formato del link de referido: `{hosted_url}?ref={referral_code}`

## Hito 4 — Widget + Página Hosteada

- Widget JS (`public/widget.js`): vanilla JS, sin dependencias, busca contenedores `.wl-waitlist[data-key]`
  - Obtiene config desde la API, renderiza el formulario con branding
  - Maneja Turnstile, estados de error/éxito, muestra posición
  - Link de referido con botón copiar, leaderboard
  - Lee `?ref=` de la URL de la página padre
- Página hosteada (`/p/[slug]`): SSR con branding, formulario, estado de éxito
- Modo formulario sin JS

## Hito 5 — Anti-spam

- Validación de Cloudflare Turnstile (server-side)
- Verificación de dominio de email desechable (30+ dominios conocidos)
- Rate limiting por IP (10 peticiones/min/IP, en memoria)
- Validación de formato de email

## Hito 6 — Gating por Plan

- `plan-gates.ts`: conjuntos de features por plan (free/launch/grow/scale), helpers `hasFeature()`/`getNextPlan()`
- Componente `FeatureGate`: envuelve UI, muestra overlay de candado + CTA "Upgrade to unlock" para features bloqueadas
- Enforcement del límite de envíos: suscriptores más allá del límite obtienen `status='hidden'`

## Hito 7 — Pagos con Paddle

- `lib/paddle.ts`: mapeo de price IDs, límites por plan
- Página de upgrade: muestra planes Launch ($29) y Grow ($79) con listas de features
- Checkout overlay de Paddle con `custom_data` (account_id, waitlist_id, plan)
- Paddle.js cargado via `<Script>` en el layout del dashboard
- Webhook handler (`POST /api/webhooks/paddle`):
  - `transaction.completed`: crea registro de compra, actualiza plan + submission_limit, reactiva suscriptores ocultos
  - `transaction.refunded`: marca compra como reembolsada

## Hito 8 — Emails (Resend)

- Helper `sendEmail()` (basado en fetch, sin SDK)
- Email de bienvenida (Launch+): posición, link de referido
- Notificación al dueño (Free+): avisa al dueño de la waitlist cuando alguien se registra
- Email de verificación (plantilla para double opt-in)

## Hito 9 — Verificación + Slack

- Endpoint `GET /api/public/verify?token=...`: verifica el email del suscriptor usando token HMAC
- Token de verificación: `base64url(subscriberId:email:sha256_hash)` con `SUPABASE_SERVICE_ROLE_KEY` como secreto
- Notificaciones Slack (Launch+): envía mensaje al webhook configurado en settings

## Pendiente (no construido)

- **Deploy a producción**: conectar Vercel + Supabase real, configurar env vars, DNS
- **UI de miembros de equipo** (la tabla `account_members` existe pero no tiene UI)
- **Formulario "Talk to us" para plan Scale**
- **Internacionalización (i18n)**: traducir widget/página hosteada según el idioma configurado
- **Rewards & milestones**: UI para configurar y mostrar progreso hacia recompensas
- **Webhooks + Zapier**: configuración de webhooks personalizados
- **Rate limiting con Redis**: el actual es en memoria, no funciona en múltiples instancias de Vercel

## Env vars requeridas

```
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_PRICE_LAUNCH=
PADDLE_PRICE_GROW=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
RESEND_API_KEY=
```
