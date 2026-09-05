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
- Page Builder: hosted landing page with hero/features/how-it-works/faq/form/media-text sections. Default colors are cream (`#fbf8f3` background) + bordeaux (`#7a3325` button), matching the design system. Five alternative templates (neon, carbon, pastel, editorial, split) are gated to paid plans.
- Testimonials: embeddable forms (`/t/[formSlug]`), dashboard moderation by the project owner (pending → approve/reject, or auto-publish per form), custom questions persisted as answers, public render on `/product/[slug]` (carousel for paid, grid for free)
- Email validation (MX lookup) + geoIP (Cloudflare CF-IPCountry) on signup
- DB model: account → project (each project has waitlist + showcase) + subscription
- Plan is per-project (free/launch), subscription via Paddle

## Design principles (draft)

- Elegant, refined, type-led (serif for headings)
- Understated but warm — not minimalist-cold
- Trustworthy for a paid product
- Operate mode for dashboard (task completion), Persuade for landing

