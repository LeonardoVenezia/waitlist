# Contexto del Proyecto — Waitlist by [PACK]

> Creado: 2026-07-22
> Stack: Next.js 16 + Supabase + shadcn/ui + Tailwind 4
> Dominio: https://waitlist-nine-pink.vercel.app

---

## El Producto

Software de **waitlist viral pre-lanzamiento** (clon de LaunchList). El usuario crea una waitlist, la gente se anota con un link de referido único y sube en la cola cuando trae amigos. Free hasta 150 suscriptores, después pago único por proyecto vía Paddle.

---

## Stack técnico

| Capa | Tecnología | Variables de entorno |
|---|---|---|
| Frontend + Backend | Next.js 16 (App Router, Turbopark) | — |
| UI | shadcn/ui + Tailwind 4 + `@base-ui/react` | — |
| BD + Auth + Storage | Supabase (Postgres) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Pagos | Paddle Billing (one-time) | `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRICE_LAUNCH`, `PADDLE_PRICE_GROW` |
| Anti-bot | Cloudflare Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| Email | Resend | `RESEND_API_KEY` |

## Cuentas creadas

- **Supabase**: proyecto `dxgxbugfjxzgvqzsjgff` (ref: `dxgxbugfjxzgvqzsjgff`)
- **Vercel**: proyecto `waitlist-nine-pink`
- **Paddle**: vendedor `LeoVenezia Studios` (ID: 382617), cuenta en verificación (`verificationStatus: pending`)
- **Turnstile (Cloudflare)**: site para `waitlist-nine-pink.vercel.app`
- **Resend**: pendiente de configurar API key real

**Estado de Paddle**: la cuenta está en verificación, por lo que `transaction.completed` rechaza con `transaction_checkout_not_enabled`. Para probar pagos, hay que esperar que Paddle verifique la cuenta, o alternativamente crear precios en sandbox (cuando Paddle lo habilite).

---

## Rutas construidas (23 rutas dinámicas)

### Públicas (sin sesión)
| Ruta | Método | Descripción |
|---|---|---|
| `/` | GET | Landing page, redirige a /dashboard si hay sesión |
| `/login` | GET | Login (email/password + Google OAuth) |
| `/signup` | GET | Registro |
| `/pricing` | GET | Página de precios |
| `/p/[slug]` | GET | Página hosteada de waitlist (SSR) |
| `/auth/callback` | GET | Callback OAuth de Supabase |
| `/api/public/waitlist/[publicKey]` | GET | Config pública de waitlist (branding, campos) |
| `/api/public/subscribe` | POST | Endpoint de registro (con Turnstile, rate limit, referidos) |
| `/api/public/position` | GET | Consultar posición actual + referral_count |
| `/api/public/verify` | GET | Verificar email (double opt-in, token HMAC) |

### Dashboard (requieren sesión)
| Ruta | Descripción |
|---|---|
| `/dashboard` | Overview, redirige a primera waitlist o a crear |
| `/dashboard/waitlists` | Lista de waitlists |
| `/dashboard/waitlists/new` | Crear waitlist (form con nombre + slug) |
| `/dashboard/waitlists/[id]` | Detalle + navegación a subsecciones |
| `/dashboard/waitlists/[id]/settings` | Settings (branding, hero, form, thank-you, referral, notificaciones, idioma) |
| `/dashboard/waitlists/[id]/subscribers` | Tabla de suscriptores con búsqueda, filtros, paginación |
| `/dashboard/waitlists/[id]/analytics` | Agregados básicos (total, verificados, con referidos) |
| `/dashboard/waitlists/[id]/embed` | Código del widget + link hosteado |
| `/dashboard/waitlists/[id]/export` | Exportar CSV/XLSX |
| `/dashboard/waitlists/[id]/upgrade` | Upgrade con checkout de Paddle |
| `/dashboard/settings/purchases` | Historial de compras |
| `/dashboard/sign-out` | Cerrar sesión |

### Webhook
| Ruta | Método | Descripción |
|---|---|---|
| `/api/webhooks/paddle` | POST | Webhook de Paddle (transaction.completed, adjustment.created/updated) |

### Proxy (Middleware)
`/proxy.ts` — Antes era `middleware.ts` pero Next.js 16 lo renombró a `proxy`. Refresca la sesión de Supabase en cada request.

---

## Base de datos (esquema en `supabase/schema.sql`)

### Tablas
1. **`profiles`** — 1:1 con `auth.users`. Se crea automáticamente con trigger.
2. **`accounts`** — Backbone multi-producto. Cada usuario tiene su cuenta.
3. **`account_members`** — Miembros de equipo (para plan Grow, UI pendiente).
4. **`waitlists`** — Proyecto de waitlist. Tiene `settings` (JSONB) con branding, hero, etc.
5. **`subscribers`** — Cada persona que se anota. `referral_count` denormalizado.
6. **`purchases`** — Historial de transacciones de Paddle.

### RLS (Row Level Security)
- `profiles`: el usuario ve solo su fila (`auth.uid() = id`)
- `accounts`: solo el owner (`auth.uid() = owner_id`)
- `waitlists/subscribers/purchases`: acceso vía `account_members`
- El endpoint público de signup usa `service_role` (bypass RLS) con validación manual

### Funciones SQL
- `get_position(subscriber_id)` — calcula posición via `ROW_NUMBER() OVER (ORDER BY referral_count DESC, created_at ASC)`
- `increment_referral_count(subscriber_id)` — incremento atómico

### Trigger
- `on_auth_user_created` — al registrarse crea profile + account + account_membership

---

## Loop de referidos

1. Cada signup genera un `referral_code` único (nanoid de 8 chars)
2. Si viene con `?ref=CODE`, se busca al referidor por `referral_code` misma waitlist
3. Se inserta subscriber con `referred_by` y en la misma operación se incrementa `referral_count`
4. La posición se calcula al leer: `ROW_NUMBER() OVER (referral_count DESC, created_at ASC)`
5. El leaderboard muestra top N por referral_count (emails enmascarados: `jo***@gmail.com`)

---

## Anti-spam

1. **Turnstile** — widget de Cloudflare en el formulario, verificado server-side
2. **Email desechable** — lista de 30+ dominios conocidos
3. **Rate limit** — 10 requests/min por IP (en memoria, no sirve para producción multi-instancia)
4. **Validación de formato** — regex de email

---

## Widget JS (`public/widget.js`)

Vanilla JS, sin dependencias. Busca contenedores `.wl-waitlist[data-key]` y renderiza formulario inline. CORS abierto en todos los endpoints públicos (`Access-Control-Allow-Origin: *`).

---

## Planes y gating

| Plan | Precio | Límite | Features clave |
|---|---|---|---|
| Free | $0 | 150 | Widget, referrals, export CSV/XLSX, analytics básica, email notification |
| Launch | $29 | 500 | + double opt-in, welcome email, Slack, milestones, traducción, Turnstile |
| Grow | $79 | 10.000 | + team members, webhooks, quitar branding, priority support |
| Scale | Custom | ilimitado | Talk to us (sin checkout) |

Archivo `src/lib/plan-gates.ts` — contiene feature sets y función `hasFeature(plan, feature)`. Componente `FeatureGate` para UI con candado.

---

## Limitaciones conocidas / Pendientes

### Bugs conocidos
- **Rate limiting en memoria**: no funciona con múltiples instancias de Vercel. Migrar a Upstash Redis.
- **El menú de perfil (user-nav) se rompió con `@base-ui/react`**: lo reemplacé por HTML puro.

### Funcionalidad pendiente
- **Deploy a producción completo**: falta conectar algunas env vars reales en Vercel.
- **UI de miembros de equipo**: la tabla `account_members` existe pero no hay pantalla de gestión.
- **Formulario "Talk to us" para Scale**: actualmente no hay forma de contactar.
- **Internacionalización (i18n)**: el widget y la página hosteada ignoran el idioma configurado.
- **Rewards & milestones**: display-only, no implementado.
- **Webhooks + Zapier**: configuración de webhooks personalizados (plan Grow).
- **Paddle verificación pendiente**: la cuenta de Paddle no puede procesar pagos hasta que complete verificación.

---

## Cómo levantar en local

```bash
pnpm dev
# necesita .env.local con todas las variables
```

## Cómo deployar

Push a main → Vercel deploya automáticamente. Las env vars se configuran en Vercel → Settings → Environment Variables.

---

## Archivos clave

| Archivo | Propósito |
|---|---|
| `supabase/schema.sql` | Esquema completo de BD |
| `supabase/backfill.sql` | Backfill para usuarios creados antes del trigger |
| `src/lib/supabase/types.ts` | Tipos de TypeScript para la BD |
| `src/lib/plan-gates.ts` | Features por plan |
| `src/lib/api/account.ts` | Helper para obtener account_id |
| `src/lib/api/cors.ts` | Headers CORS para endpoints públicos |
| `src/lib/api/verify-token.ts` | Tokens HMAC para verificación de email |
| `src/lib/api/rate-limit.ts` | Rate limiter en memoria |
| `src/lib/api/referral-code.ts` | Generación de códigos de referido |
| `src/lib/api/position.ts` | Cálculo de posición |
| `src/lib/api/leaderboard.ts` | Leaderboard (emails enmascarados) |
| `src/lib/api/slack.ts` | Notificaciones Slack |
| `src/lib/api/validate-turnstile.ts` | Validación Turnstile |
| `src/lib/email.ts` | Envío de emails vía Resend |
| `src/lib/paddle.ts` | Helper de Paddle |
| `src/lib/disposable-emails.ts` | Lista de dominios desechables |
| `src/proxy.ts` | Proxy de sesión (reemplaza middleware.ts) |
| `public/widget.js` | Widget JS embebible |
| `src/components/shared/feature-gate.tsx` | Componente de candado por plan |
| `src/components/shared/paddle-init.tsx` | Inicialización de Paddle.js |
| `src/components/dashboard/user-nav.tsx` | Menú de perfil (HTML puro, sin base-ui) |
| `src/app/p/[slug]/public-waitlist-form.tsx` | Formulario de página hosteada |
| `CHANGELOG.md` | Historial de cambios (inglés) |
| `CHANGELOG.es.md` | Historial de cambios (español) |
