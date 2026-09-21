# Changelog — Waitlist by [PACK]

## Build output (22 routes)

```
ƒ /                          Landing page (redirects to /dashboard if authed)
ƒ /auth/callback             OAuth callback handler
ƒ /login                     Login (email/password + Google)
ƒ /signup                    Registration
○ /pricing                   Pricing page
ƒ /p/[slug]                  Hosted waitlist page (SSR)
ƒ /dashboard                 Dashboard overview
ƒ /dashboard/waitlists       Waitlist list
ƒ /dashboard/waitlists/new   Create waitlist
ƒ /dashboard/waitlists/[id]          Waitlist detail
ƒ /dashboard/waitlists/[id]/settings Settings form
ƒ /dashboard/waitlists/[id]/subscribers Subscribers table
ƒ /dashboard/waitlists/[id]/analytics Analytics
ƒ /dashboard/waitlists/[id]/embed    Embed code
ƒ /dashboard/waitlists/[id]/export   Export page
ƒ /dashboard/waitlists/[id]/upgrade  Upgrade / Paddle checkout
ƒ /dashboard/settings/purchases      Purchase history
ƒ /dashboard/sign-out                Sign out
ƒ /api/public/waitlist/[publicKey]   Widget config (GET)
ƒ /api/public/subscribe              Signup endpoint (POST)
ƒ /api/public/position               Position lookup (GET)
ƒ /api/waitlists/[id]/export         CSV/XLSX export (GET)
ƒ /api/webhooks/paddle               Paddle webhook (POST)
ƒ Proxy (Middleware)                 Supabase session refresh
```

## Milestone 1 — Scaffold + Database

- Next.js 16 (App Router, Turbopack, src/ dir) + Tailwind 4 + shadcn/ui
- Supabase: `client.ts`, `server.ts`, `admin.ts`, `proxy-session.ts` (replaces deprecated middleware)
- Auth: email/password + Google OAuth, server actions with `useActionState`, callback handler
- Landing page, pricing page, sign-in/sign-up pages
- Dashboard shell: sidebar with product registry pattern, user nav dropdown (purchases, sign out)
- Waitlist CRUD: create form with slug validation, detail page with subscriber/plan stats
- SQL schema (`supabase/schema.sql`): 6 tables (profiles, accounts, account_members, waitlists, subscribers, purchases), RLS policies, auto-create trigger on signup (profile + account + account_membership), `get_position` function, `increment_referral_count` function

## Milestone 2 — Waitlist CRUD + Settings

- Settings form with save action: branding (name, slug, logo, color), hero (title, subtitle, CTA), form (collect name), thank-you page (message, position/referral/leaderboard toggles), referral settings (enabled, positions per referral, reward text), notifications (email on signup, Slack webhook), language
- Public API:
  - `GET /api/public/waitlist/:publicKey` — returns config (branding, form fields)
  - `POST /api/public/subscribe` — full signup flow: Turnstile validation → email format → disposable domain check → IP rate limiting → referral code generation → referral loop (denormalized count increment) → submission limit gating (`hidden` status) → position calculation → leaderboard
  - `GET /api/public/position?public_key=&code=` — refresh position + referral count
  - `GET /api/waitlists/[id]/export?format=csv|xlsx` — export active subscribers

## Milestone 3 — Referral Loop + Position Engine

- Position calculated at read time: `ROW_NUMBER() OVER (ORDER BY referral_count DESC, created_at ASC)`
- Referral code: nanoid(8) with collision retry
- `referral_count` denormalized on subscriber, incremented atomically via SQL `increment_referral_count()`
- Leaderboard: top N subscribers ordered by referral_count DESC, created_at ASC
- Referral link format: `{hosted_url}?ref={referral_code}`

## Milestone 4 — Widget + Hosted Page

- JS widget (`public/widget.js`): vanilla JS, no dependencies, finds `.wl-waitlist[data-key]` containers
  - Fetches config from API, renders form inline with branding
  - Handles Turnstile, error/success states, position display
  - Referral link with copy button, leaderboard
  - Reads `?ref=` from parent window URL
- Hosted page (`/p/[slug]`): SSR page with branding, form, success state
- Custom form (no-JS) mode

## Milestone 5 — Anti-spam

- Cloudflare Turnstile validation (server-side)
- Disposable email domain check (30+ known domains)
- IP-based rate limiting (10 requests/min/IP, in-memory)
- Email format validation

## Milestone 6 — Plan Gating

- `plan-gates.ts`: feature sets per plan (free/launch/grow/scale), `hasFeature()`/`getNextPlan()` helpers
- `FeatureGate` component: wraps UI, shows lock overlay + "Upgrade to unlock" CTA for locked features
- Submission limit enforcement: subscribers beyond limit get `status='hidden'`

## Milestone 7 — Paddle Payments

- `lib/paddle.ts`: price ID mappings, plan limits
- Upgrade page: shows Launch ($29) and Grow ($79) plans with feature lists
- Paddle Checkout overlay wired with `custom_data` (account_id, waitlist_id, plan)
- Paddle.js loaded via `<Script>` in dashboard layout
- Webhook handler (`POST /api/webhooks/paddle`):
  - `transaction.completed`: creates purchase record, updates plan + submission_limit, reactivates hidden subscribers
  - `transaction.refunded`: marks purchase as refunded

## Milestone 8 — Email (Resend)

- `sendEmail()` helper (fetch-based, no SDK needed)
- Welcome email (Launch+): position, referral link
- Signup notification (Free+): notifies waitlist owner on new signup
- Verification email template (for double opt-in)

## Planned but not built

- Double opt-in verification flow (wiring + verify endpoint)
- Slack webhook notifications
- Rewards & milestones UI
- Team members UI
- Webhooks + Zapier configuration
- i18n translation of widget/hosted page
- Scale plan "Talk to us" contact form
- Rate limiting with Redis (in-memory is fine for single-instance, Vercel needs Upstash)

## Env vars required

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

## Milestone 10 — Design system refinement

- **Icon system**: 22 inline SVG icons in `src/components/ui/icon.tsx` (stroke 1.5, currentColor, no library dependency). Replaces ~35 native emoji used as UI chrome across the sidebar, page builder, integration tabs, integration card, public form, and analytics empty state.
- **Form controls**: `Select`, `Textarea`, `Checkbox`, `RadioGroup` plus an `Input` with optional `leftIcon`/`rightIcon` slot. Migrated all 14 raw `<select>`, 4 `<input type="date">`, 7 `<input type="checkbox">`, and 2 `<input type="radio">` across the dashboard and public pages. iOS Safari keeps the native arrow on `<select>` (known limitation).
- **Shared chrome**: `ActiveLink` unifies the active-state pattern between the dashboard sidebar and the public header. `ProductPlaceholder` replaces the three different emoji placeholders (`🖼️`, `🚀`, `null`) with initials in Instrument Serif over the muted surface.
- **Page builder**: section types now render line-icon SVGs (Hero / Features / Steps / Question / Form / Media). Template thumbnails use initials + a dark/light tone hint instead of emoji. Default `bg_color` and `button_color` for the Custom builder switched to the cream/bordeaux palette (`#fbf8f3` / `#7a3325`); existing projects that saved the legacy defaults are auto-migrated on render.
- **Landing templates**: all 5 templates (editorial, split, neon, carbon, pastel) switched to the design tokens (`text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`, `bg-card`, `bg-muted`). Headlines use `font-heading` (Instrument Serif). Primary buttons use `bg-primary` instead of `violet-500` / `bg-white` / `emerald-500` / `bg-neutral-900` depending on the template. Editorial's default `accent_color` is now `#7a3325` (was `#2563eb`); legacy values are auto-detected and treated as unset.
- **Documentation**: `DESIGN.md` updated with the new component guidance, the no-emoji-as-UI-chrome rule, and the design-token-only rule for templates.

## Milestone 11 — Testimonial wizard (Senja-style flow)

- **Multi-step public form**: `/t/[formSlug]` (and the `/embed` variant) is now a wizard built from the form config. Steps: Rating → Testimonial → custom questions → private feedback → usage consent → About you → About your company → Review → Thank you. Each step is omitted when it has nothing enabled, so minimal forms stay short. Back/Continue navigation, per-step validation, a minimal progress bar, and inline errors instead of `alert()`.
- **New fields**: author photo (`avatar_url`, already in the schema) and company logo (`company_logo_url`), website (`website`), private feedback (`private_feedback`) and usage consent (`consent`). New migration `019_testimonial_wizard.sql` adds the four new columns to `testimonials`; the TypeScript types were synced.
- **Image upload**: reuses the showcase/page-builder signed-URL protocol. New route `/api/testimonials/upload-url` issues signed upload URLs into the `showcase-images` bucket scoped to `testimonials/<formId>/`, protected by IP rate-limit, Turnstile (when configured) and a published-form check. `ImageUpload` gained `endpoint`, `extraBody`, `onUploaded`, `variant` and `preview` props.
- **Consent & privacy**: testimonials submitted with `consent = 'private'` are excluded from the public `/product/[slug]` render, even when approved. Card avatars now resolve bucket-relative paths to the public bucket URL.
- **Form editor**: new "Extra steps" card (private feedback, usage consent) and a reward-code field in "After submitting"; the field list gained Photo, Website and Company logo. The live preview and `/preview/forms/[formId]` reflect all of it.
- **Thank-you screen**: shows the configurable reward code with a copy button (redirect still overrides the screen when set).

## Turnstile desactivado (kill switch)

- Nuevo switch maestro `TURNSTILE_ENABLED` en `src/lib/turnstile.ts`, hoy en `false`. Apaga el captcha en **toda** la app sin borrar código: el wizard de testimonials, el form hosteado `/p/[slug]`, los templates del page builder y el script de Cloudflare en `/p/*` no renderizan ni ejecutan ningún challenge; y `validateTurnstileToken` + las rutas `/api/public/subscribe`, `/api/testimonials/submit` y `/api/testimonials/upload-url` dejan de exigir token.
- Para reactivarlo: poner la bandera en `true` (y tener `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`). No hace falta ningún otro cambio.

## Testimonial form — refinamiento de escala y detalle

- **Escala tipo Senja**: el form público pasa a una columna centrada `max-w-xl`, full-height, con el nombre del form como masthead serif — se elimina la tarjeta (`rounded-xl border bg-card`) en las tres shells (`/t/[slug]`, `/t/[slug]/embed`, `/preview/forms/[id]`). Títulos de paso a `text-2xl/3xl` regular, labels a `text-base`, inputs/textarea más altos, CTA `h-12` full-width, más aire vertical.
- **Rating**: las estrellas arrancan vacías (`text-border`, no amarillas) y el paso es obligatorio — hover rellena hasta el cursor, click fija. Nuevo tamaño `xl` (44px) en `StarRating`. Se agregan `focus-visible` ring y `aria-label` por estrella.
- **Nav**: Back y Continue ya no comparten fila (el `w-full` desbordaba el contenedor). Ahora stack vertical centrado: CTA arriba, "Back" como texto plano abajo. El botón final pasa a "Send testimonial".
- **Validación de email**: al no haber `<form>` nativo, `type="email"` no validaba. Se agrega validación explícita en el paso "About you" (mismo regex que `/api/public/subscribe`), `aria-invalid` en el control y `role="alert"` en el error. Enter avanza el wizard (excepto en textareas).
- **Thank-you**: rediseñado como nota cálida — headline serif con el nombre de la persona, mensaje por defecto más humano, y el código de recompensa como ticket (borde punteado + divisor + copiar). Se elimina el círculo verde genérico. Entrada suave con `@keyframes rise` (`.animate-rise`), respetando `prefers-reduced-motion`.
- **Limpieza de drift**: títulos serif vuelven a `font-normal` (la regla del sistema), el `<select>` de preguntas custom pasa al componente `Select`, y los focus rings de los campos se alinean al sistema (`ring-3 ring-ring/50`).

## Testimonial form — segunda pasada

- **Títulos en negrita**: masthead, títulos de paso y headline del thank-you pasan a `font-semibold` (el usuario comparó en el navegador y prefiere así). Excepción documentada en `DESIGN.md`, que venía pidiendo serif regular.
- **Thank-you más amable**: ahora devuelve el testimonio del autor usando el mismo `TestimonialCard` que verá el owner (avatar/foto, nombre, cargo/empresa, estrellas, texto y respuestas custom), en vez de un simple acuse de recibo. El código de recompensa queda debajo, como ticket.
- **Fix**: si un form tiene el campo Rating desactivado, el wizard enviaba `rating: 0`, lo que violaba el check `1..5` de `testimonials.rating` y hacía fallar el submit. Ahora cae al default 5 cuando no se pidió rating.

## Headings en negrita (global)

- La regla base de `globals.css` para `h1`–`h4` pasa a `@apply font-heading font-semibold tracking-tight`, así que **todos los títulos de la app heredan la negrita desde un único lugar**. La app ya venía con `font-bold` en las páginas públicas y `font-semibold` en el dashboard; la regla de DESIGN.md ("No bold") estaba desactualizada respecto del código y quedó corregida.
- Los `h1`–`h4` que declaran `font-bold` explícito lo conservan; con Italiana (que solo trae peso 400) el bold es sintetizado y se ve igual que semibold, así que no hay inconsistencia visual. Pendiente opcional: normalizar esos overrides para que el peso viva en un solo lugar.
