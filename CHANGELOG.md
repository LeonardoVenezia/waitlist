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

## Testimonial photo — reducción de peso y tamaño

- **Downscale en el cliente**: `ImageUpload` acepta `maxDimension`. Cuando se pasa, la imagen se redimensiona en el browser (canvas + `createImageBitmap`) y se reencoda a **WebP calidad 0.85** antes de pedir la signed URL — no viaja el original de 3–8 MB de una foto de celular. Si algo del pipeline no está disponible, cae al archivo original sin romper la subida.
- El wizard de testimonials usa `maxDimension={256}` para la foto del autor y el logo de empresa (se renderizan a ~40px).
- **Límite de entrada**: con `maxDimension` el máximo subible pasa de 2 MB a 12 MB, porque el origen esperado es una foto de celular y el resultado final es chico igual.
- **Affordance**: el uploader en modo avatar pasa de 80px con texto de 10px a 96px con texto de 12px, y el paso "About you" agrega una línea explicando para qué se usa la foto.
- **Nota**: el campo `photo` sigue siendo un toggle por form (Fields → Photo), apagado por defecto para forms nuevos.

- **Foto activada por defecto**: el set de campos por defecto de un form nuevo pasa a `["name","email","message","rating","photo"]` (`createForm` + default de la columna en `019`). Al form de prueba existente se le activó el campo `photo`.

## Títulos de sección del editor de forms

- Los 9 títulos de tarjeta del editor de formularios pasan de `font-medium text-sm` (14px, 500) a **`font-semibold text-lg`** (18px, negrita): Fields, Moderation, Extra steps, After submitting, Status y Danger zone en `form-editor.tsx`, Questions en `questions-editor.tsx`, y Request testimonials / Sent invites en `invites-client.tsx`.
- Como la regla base ya aplica `font-heading` a todo `h1`–`h4`, quedan serif + negrita, iguales a la convención de card title que ya usaban `showcase-card` y `showcase-form`.
- Los márgenes inferiores estaban desparejos (`mb-1` en la mayoría, `mb-4` en Moderation y Status, ninguno en Sent invites); se normalizaron a **`mb-3`** en los 8 títulos que van sobre contenido apilado. "Sent invites" queda sin margen a propósito: es el título de un header horizontal (`flex items-center justify-between`), donde un `mb` desalinea en vez de dar aire.

## Page Builder: un solo botón para guardar

**El bug**: el estilo de la waitlist no se guardaba. El render público se decide con un único campo, `settings.page_sections.template_id`, y de los tres botones del Page Builder ninguno de los que uno usa naturalmente lo escribía: "Save changes" solo escribía `sections` + `global`, "Save template" exigía que `template_id` ya existiera en la DB (si no, fallaba en silencio), y únicamente "Apply template" lo escribía.

- **Un solo botón**: `savePageDesign` reemplaza a `savePageSections` y `selectTemplate`, y escribe `template_id` + `template_data` + `sections` + `global` en una sola actualización. Se eliminan los botones "Apply template" y "Save template".
- **Feedback honesto**: las acciones ya devolvían `{ error }` pero el cliente las descartaba y mostraba "✓ Saved" igual. Ahora el retorno se revisa y el error real se muestra en rojo.
- **Estado sin guardar**: indicador "Unsaved changes" (contra el último snapshot guardado) y guard `beforeunload`, porque ahora el botón único es la única vía de persistencia.
- **"Restore default content"**: reemplaza la mitad útil de "Apply template" (volver el contenido del template a sus defaults), como acción local que se persiste con el botón único.
- **Global Settings siempre visible**: antes se ocultaba con un template activo, pero `global.page_enabled` y `global.seo_*` sí se aplican en modo template (la página pública los lee antes de resolver el template). Con nota aclaratoria: colores y toggles de display solo aplican al custom builder.
- **Sin tocar las embebidas**: `saveTemplateData` queda intacta porque la usa la página de integración del widget; `TemplateEditor` recibe un `showSaveButton` opcional (default `true`) y el Page Builder lo pasa en `false`, así la integración conserva su propio botón.
- **Proyectos degradados**: si el plan no permite templates o el id es desconocido, se preservan los campos de template guardados y se guardan igual `sections`/`global`.

## Template "Mono" para el Page Builder

Nueva template de landing, registrada siguiendo el patrón existente (Neon, Carbon, Pastel, Editorial, Split). Estética de precisión brutalista, pensada para forzar una promesa concreta.

- **Registro** (mismo patrón que las demás): `TemplateId`, `MonoTemplateData`, `monoDefaults`, entrada en `TEMPLATE_DEFINITIONS`, rama propia en `normalizeTemplateData` (sin ella caía al normalizador de Split), rama en `TemplateRenderer` y en `TemplateEditor`, más `TEMPLATE_ACCENT_COLOR` de la página de integración y la unión local duplicada en `/preview/[slug]`.
- **Diseño**: fondo `#FAFAFA`, texto casi negro, un único acento `#2540FF` (constante del módulo, no campo del builder), esquinas rectas, sin gradientes, sombras ni imágenes. Badge y labels en monospace; título en la sans geométrica con `font-extrabold` y tracking negativo (`-0.045em`) a tamaño `clamp(2.5rem, 7.5vw, 4.5rem)`.
- **Campos del builder**: badge text, title, subtitle, CTA label, social count override y toggle de social proof. Sin floating tags.
- **Copy del contador**: `realCount > 1` → "N people in line"; `= 1` → "1 person in line"; `= 0` → "Be the first in line" (nunca muestra "0 people in line", que es prueba social negativa). Un override se muestra literal. Formateo con locale explícito para evitar hydration mismatch.
- **Arreglo necesario**: `--font-mono` apuntaba a `var(--font-geist-mono)` pero esa variable **no se definía en ningún lado**, así que `font-mono` no renderizaba monoespaciado en toda la app (afectaba también a Neon, Carbon, Editorial y Split). Se carga Geist Mono en `layout.tsx`.
- Nota: el título usa `font-sans` explícito porque la regla base `h1,h2,h3,h4 { font-heading }` aplica la serif Italiana a todo heading.

## Los templates dejan de heredar la tipografía global

Los templates son mundos visuales autocontenidos, pero la regla base `h1,h2,h3,h4 { font-heading }` se filtraba adentro: `neon`, `carbon` y `pastel` nunca declaran familia, así que sus titulares se renderizaban en **Italiana serif** (un hero oscuro tech y un teaser estilo developer con serif elegante). `editorial` y `split` sí la declaran a propósito, y `mono` declara `font-sans`.

- **Mecanismo**: cada template se renderiza dentro de un wrapper `data-surface="template"` y una regla en `@layer base` resetea `h1`–`h4` a `font-family: inherit` ahí. Alta especificidad, misma capa → gana sobre la regla genérica. Pero **las utilidades están en una capa posterior**, así que `.font-heading` / `.font-sans` siguen ganando: Editorial, Split y Mono conservan su elección, y los templates nuevos quedan protegidos solos.
- **SEO en modo template**: `generateMetadata` armaba el `<title>` con `global.seo_title || <título del hero de las secciones> || nombre del proyecto`. Con un template activo las secciones **no se renderizan**, así que `/p/showcase` publicaba `<title>Startpack</title>` (una sección invisible) mientras la página mostraba el titular "Startups Army" del template. Ahora el fallback lee `template_data.title` antes de caer al hero de secciones.
- **Preview fiel**: el preview inline del Page Builder envolvía al template en un contenedor pintado con `global.bg_color` y recortado a 720px, mientras en producción es full-bleed con su propio fondo. Ahora, con template activo, el preview renderiza igual que la página publicada.

Lo que **no** se toca, a propósito: `global.page_enabled` (es el interruptor de despublicar → 404) y `global.seo_title` / `seo_description` / `seo_indexable` (no son parte del mundo visual; un template no puede generar metadata y el override explícito del dueño siempre gana).

## La regla de templates estaba al revés (+ la paleta del doc no era la de la app)

El anti-pattern de `DESIGN.md` decía que los templates debían usar los tokens de la app (`text-foreground`, `bg-primary`, `border-border`…). Estaba mal, y el propio código ya declaraba la política opuesta: los comentarios de Neon ("deliberately does NOT use the host app's tokens") y de Pastel ("explicitly NOT"). Si un template heredara `--primary` o `--background`, el usuario no tendría motivo para elegirlo.

- **Regla nueva** (`DESIGN.md` → *Color palette → Templates*): el template es dueño de su mundo y a cambio se compromete a (1) **explicitud** — declarar sus colores y su tipografía, sin heredar nada de la app; (2) **coherencia** — una rampa neutra + un acento (un segundo hue solo como par diseñado); (3) **contraste AA** — 4.5:1 texto normal, 3:1 grande, placeholders no exentos; (4) **inmunidad** — no depender del estado ambiente.
- El anti-pattern pasa a prohibir los **tokens dentro de un template** y aclara que las rampas `zinc`/`neutral` no están prohibidas: son su base neutra.
- **Contrastes corregidos** — la regla vieja no detectaba ninguno: `mono` labels 11px y contador `black/45 → black/60` (3.31 → 5.67:1); `carbon` línea de prueba social `zinc-500 → zinc-400` (4.04 → 7.63:1); `split` caption del testimonio `neutral-400 → neutral-500` (2.42 → 4.54:1). Los placeholders quedan como deuda conocida.

### Paleta

`DESIGN.md` documentaba `--primary: oklch(0.35 0.06 25)` (borbó oscuro, `#562d2a`) mientras `globals.css` tiene `oklch(0.48 0.19 70)` (**óxido**, `#9d3e00`). Conviven tres terracotas distintas: el token, el del doc y el `#7a3325` hardcodeado. Se confirmó que **`globals.css` manda**.

- Tablas Light y Dark de `DESIGN.md` reescritas con los valores reales de `:root`, con el hex equivalente junto al oklch y la nota de que el valor se toma del token.
- `--sidebar-bg`: el doc lo afirmaba y se contradecía en la misma línea ("no sidebar-specific tokens"); el sidebar en realidad es `<aside className="… border-r bg-card">` y la variable no existe en ningún lado.
- El bloque `.dark` queda documentado como **no cableado** (nada aplica la clase) en vez de aparentar que está activo.
- Corregidas las menciones a "bordeaux" en `DESIGN.md`, `PRODUCT.md`, `page-builder/page.tsx`, `p/[slug]/page.tsx` y los comentarios de `pastel`, `editorial` y `split`.
- **No tocado, reportado**: el email de invitación (`src/emails/testimonial-invite.ts`) sigue con `#7a3325` hardcodeado — según la preferencia registrada, eso es un bug de drift; y `#22c563` en Neon es casi seguro un typo de `#22c55e`.

## Los emails llevan la estética del proyecto

Los 8 emails transaccionales estaban pintados con la **marca original de la app**: 5 con el verde `#22c563` del commit inicial, 1 con el terracota `#7a3325`, ninguno igual al `--primary` real. Además cada uno repetía su propio `<body>` y sus propios literales, y `settings.branding` (logo + color) no lo leía ningún email.

- **Cada template declara un `emailPalette`** (`src/lib/templates.ts`), al lado de `thumbnail`: la misma idea — una representación del template para una superficie que no es la página — un piso más abajo. Incluye fondo, superficie, borde, texto, texto secundario, acento, texto del acento, color de link, radio y familias tipográficas.
- **La paleta se cura, no se copia.** Los colores del template tal cual fallan AA en email: blanco sobre `#22c563` = **2.27:1**, el esmeralda de Neon como link sobre blanco = 2.27:1, el violeta de Pastel con blanco = 4.23:1. Las 7 paletas (6 templates + la de la app) pasan AA en todos sus pares, verificado por aserción.
- **Neon y Carbon se adaptan a fondo claro** (decisión acordada): conservan su acento y su tipografía mono, sin email oscuro. Neon mantiene texto negro sobre su esmeralda, que es lo que ya hace en la web y encima pasa AA.
- **`src/lib/email-brand.ts`**: `APP_EMAIL_BRAND` (marca de la app, única copia del acento), `resolveWaitlistEmailBrand` (espeja los 3 niveles de `p/[slug]`: template → secciones custom → branding) y `resolveProjectEmailBrand` (estilo general del proyecto). Convierte `oklch()` a hex, porque el page builder guarda `oklch(0.48 0.19 70)` como color de botón y **los clientes de email no entienden oklch**.
- **`src/emails/layout.ts`**: shell compartido, layout de tablas, fondo explícito en un `<table>` (Outlook ignora el de `<body>`), `color-scheme: light only` para que no inviertan el diseño, logo y `escapeHtml` compartido.
- **Alcance**: los 5 emails de la waitlist (bienvenida, verificación, aviso al dueño, hito de referidos, invitación a testimonio) usan la estética de la waitlist; `claim-result` usa el estilo general del proyecto; `claim-notification` (va al staff) y `showcase-expiry` (ciclo de vida de la plataforma) usan la marca de la app.
- **Cola**: `testimonial-invite` y `claim-result` embeben el `brand` resuelto en el payload, así que **no hizo falta ninguna migración SQL**. El cron lo parsea con `parseEmailBrand`, que completa lo que falte con la marca de la app, de modo que las filas ya encoladas no rompen. Se agregó **try/catch por fila**: antes un render que tirara excepción abortaba el lote entero de 50.
- **`resendInvite` no cargaba el proyecto**, así que usaba el nombre del *form* como producto y no tenía diseño: ahora carga el proyecto y ambos caminos de invitación son iguales.
- **Marca**: los **tres** fallbacks verdes `#22c563` pasan al rust de la app (`#9D3E00` / `oklch(0.48 0.19 70)`, centralizados en `src/lib/brand.ts` con el comentario de sincronización). El peor era `settings/actions.ts`, que **escribía el verde en la DB**. Neon: `AVATAR_COLORS` cambia su verde por un teal para romper el casi-duplicado con su acento.

## Verificación

- **Render headless de los 9 envíos** (los renderers son funciones puras): sin `var(`, sin `oklch(`, sin clases de Tailwind, sin `undefined`, todas las declaraciones de color en hex, estructura de tabla y `color-scheme` presentes, y el contraste del botón medido en cada uno (6.45:1 a 18.88:1).
- **Aserción de contraste** de las 7 paletas contra los valores reales del código: todas pasan AA.
- `tsc`, `pnpm build` y lint OK (0 errores; los warnings son preexistentes).
- **Prueba real enviada**: 36 emails (cada tipo × cada template aplicable, más el caso borde del acento claro de Editorial) a una casilla de Outlook, usando los renderers, el resolutor y `sendEmail` reales. Resend aceptó los 36. La verificación final en bandeja queda pendiente del lado del usuario: Gmail y Outlook aplican sus propias reglas de color y tipografía, y la key de Resend es send-only, así que no se puede consultar estado de entrega ni rebotes por API.

## Template "Aurora" para el Page Builder

Nueva template, registrada con el mismo patrón que las demás: `TemplateId`, interfaz de datos, defaults, entrada en `TEMPLATE_DEFINITIONS` (con `thumbnail` y `emailPalette`), rama en `normalizeTemplateData`, en el renderer y en el editor, más el mapa de acento de la página de integración y la unión duplicada de `/preview`.

- **Diseño**: hero full-viewport con gradiente diagonal de amanecer (durazno → rosa → violeta) más una capa de grano (SVG `feTurbulence`) para que no se sienta plano; navbar mínima transparente; título en la serif de la casa con una palabra en itálica; formulario dentro de una tarjeta de vidrio flotante con blur y borde fino; chips de vidrio dispersos con flotación suave (respeta `prefers-reduced-motion`); y CTA sólido en tinta (`#141019`) de alto contraste contra el vidrio.
- **Itálica por marcado**: el título soporta `*palabra*`. El default ya lo usa ("Launch something *worth* waiting for") para que la función se descubra sin leer nada. Probado en los casos borde — asterisco sin cerrar, varios pares, ninguno, `**doble**` — y ninguno rompe el render.
- **Contraste medido, no estimado**: texto blanco sobre un gradiente claro es la forma clásica en que este estilo se rompe. Por eso los stops son medios/profundos en vez de pastel y hay un **velo** entre el gradiente y el contenido, y por eso las superficies de vidrio llevan tinte tinta en lugar de blanco: el vidrio blanco translúcido no sostiene texto blanco. Verificado por elemento con un modelo de composición gradiente → velo → vidrio → alfa del texto: título 8.23:1, subtítulo 7.58:1, placeholder sobre vidrio 5.35:1, chips 7.99:1, badge 9.76:1, CTA 18.79:1.
- **Campos del builder**: badge text, title (con `*itálica*`), subtitle, CTA label, floating tags, social count override y toggle de social proof.
- **Gradiente**: se implementó el cálido (amanecer). La variante oscura (azul profundo → violeta → magenta) implicaría un campo extra que no estaba en la lista de campos pedida — es agregar un toggle si lo querés.
- **Navbar**: lleva una marca decorativa (un punto con el gradiente) y no el nombre del proyecto, porque las templates no reciben el nombre. Pasar esa prop tocaría el renderer y las 7 templates.
