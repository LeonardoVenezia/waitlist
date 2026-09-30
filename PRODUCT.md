# Product: [PACK]

## Core proposition

A founder subscribes once and gets a **suite of pre-launch tools** for their project: showcase/directory, waitlist, and landing page builder. Monthly subscription per project.

## Business model

- **Per-project subscription**:
  - **Free** ($0): producto publicado en el directorio por 1 año, hasta 100 emails en la waitlist, page builder básico, widget embebible, export CSV/XLSX
  - **Launch** ($9/mes): producto publicado sin límite de tiempo, hasta 1.000 emails en la waitlist, acceso a templates de page builder, todo lo de Free
- A user can have multiple projects, each on its own plan
- Payments via Paddle (monthly subscription, not one-time)
- **Showcase expiration (Free)**: el producto se publica al hacer click en "Publicar". En ese momento se setea `expires_at = now() + 1 año`. Un cron diario (pg_cron) flipea el status a `expired` cuando vence. Los datos persisten; al upgradear a Launch el producto vuelve a `published`.
- **Waitlist overflow (Free)**: la waitlist acepta emails más allá del límite 100, pero los excedentes se guardan con `status = 'pending_unlock'` y no aparecen en el dashboard. Al upgradear a Launch, se hacen `active`.
- **Emails recordatorios**: 30 días y 7 días antes del vencimiento se envía un email al owner del proyecto. Se enqueuean en `email_queue` y los envía un endpoint cron.
- **Emails con la estética del proyecto**: los emails que tratan sobre la waitlist (bienvenida al suscriptor, verificación, aviso de nuevo signup al owner, hito de referidos, invitación a dejar un testimonio) se renderizan con el diseño de la waitlist de ese proyecto — template, secciones o branding, el mismo que ve el visitante en `/p/[slug]`, incluido el logo. Los que son sobre el proyecto en general (resultado de un claim) usan su branding. Los de plataforma (cuenta, avisos internos, vencimiento de showcase) usan la marca de la app. Los clientes de email no soportan variables CSS ni `oklch`, así que cada template declara una paleta plana propia y los fondos oscuros se adaptan a claro.
- **Pantalla post-registro**: la que ve el visitante después de dejar su email es la del **template de landing** elegido — la identidad visual continúa después del alta, incluida la confirmación, el link de referido y las recompensas. El proyecto puede ajustar el copy de la pantalla clásica (confirmación, prompt de referidos, texto de posición con los tokens `{POSITION}` y `{TOTAL}`, toggles de visibilidad) desde su propia sección **Thank You**, que además explica de dónde sale la pantalla según si hay template o no.

## Users

- **Founders / indie hackers** building pre-launch hype
- Currently MVP: showcase + waitlist per project; architecture must support adding more tools later

## Key flows

1. **Create project** → gets a waitlist + showcase (draft state)
2. **Publish showcase** → sets `expires_at` (free) or clears it (launch)
3. **Share waitlist** → widget embed, hosted page, referral links
4. **Grow** → subscribers join via referrals, leaderboard, analytics
5. **Upgrade** → subscription to Launch; showcases auto-republish if expired, pending subscribers activate
6. **Manage** → settings (branding, form, notifications), subscriber management

## Current state

- Core product: **Showcase / Directory** (homepage is the directory, `/product/[slug]`, `/products`, `/launches`, `/coming-soon`)
- Tools integrated per project: Waitlist, Showcase, Testimonials
- Waitlist: hosted page (`/p/[slug]`), widget embed (`/w/e/[publicKey]`), referral system, leaderboard, analytics, export
- Page Builder: hosted landing page with hero/features/how-it-works/faq/form/media-text sections. Default colors are cream (`#fbf8f3` background) + the rust brand accent (`oklch(0.48 0.19 70)`, i.e. `--primary`). Seven alternative templates (neon, carbon, pastel, editorial, split, mono, aurora) are gated to paid plans.
- Testimonials: embeddable multi-step form (`/t/[formSlug]` + iframe embed) that mirrors Senja's flow — Rating → Testimonial → custom questions → private feedback → usage consent → About you (name, email, photo) → About your company (job title, company, website, logo) → Review → Thank you. Steps are derived from the form config (enabled fields, custom questions, extra-step toggles), so a form with few fields stays short. Photo and company logo upload to the `showcase-images` bucket via a dedicated, rate-limited + Turnstile-protected signed-URL route, and are downscaled in the browser to 256px WebP before upload (they only ever render small). Authors can leave private feedback and choose public vs private usage consent (private testimonials never render publicly). The thank-you screen can show a configurable reward code with a copy button. Dashboard moderation by the project owner (pending → approve/reject, or auto-publish per form), custom questions persisted as answers, email invites with per-recipient tracking (queued → sent → opened → submitted), form stats (unique visits, response rate), public render on `/product/[slug]` (carousel for paid, grid for free)
- Email validation (MX lookup) + geoIP (Cloudflare CF-IPCountry) on signup
- DB model: account → project (each project has waitlist + showcase) + subscription
- Plan is per-project (free/launch), subscription via Paddle

## Design principles (draft)

- Elegant, refined, type-led (serif for headings)
- Understated but warm — not minimalist-cold
- Trustworthy for a paid product
- Operate mode for dashboard (task completion), Persuade for landing

