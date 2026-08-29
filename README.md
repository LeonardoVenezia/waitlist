# [PACK]

Suite of pre-launch tools for founders. Monthly subscription per project. Each project bundles a **showcase** (public directory entry), a **waitlist** (hosted page + widget + referral engine), and a **page builder** to customize the waitlist page. Testimonials are paused, see `PRODUCT.md`.

## Stack

- **Next.js 16** (App Router, React 19, RSC, Server Actions)
- **Supabase** (auth, Postgres, storage) — cloud project, migrations in `supabase/migrations/`
- **Tailwind CSS v4** + shadcn/ui
- **Resend** (transactional email)
- **Paddle** (monthly subscriptions)
- **Cloudflare Turnstile** (captcha) + `CF-IPCountry` (geo)

## Run

```bash
pnpm install
pnpm dev
```

Env vars in `.env.local` (see `.env.example`).

## Key architecture

- **Data model**: `account` → `project` (one project = waitlist + showcase + page builder). Table `projects` (was `waitlists`, renamed in migration 010).
- **Auth**: Supabase. `handle_new_user()` trigger auto-creates profile + account.
- **RLS pattern**: `createClient()` (RLS) for reads, `createAdminClient()` (service role) for writes, always verifying ownership with an RLS read first.
- **Feature gating**: `src/lib/plans.ts` — `hasFeature(plan, feature)`. Plans are per-project, monthly subscription. Three tiers: Free, Launch, Grow.
- **Public routes**: `/` (directory), `/product/[slug]`, `/p/[slug]` (waitlist page, customizable via page builder), `/t/[slug]` (testimonial form, paused), `/w/e/[publicKey]` (widget).
- **Dashboard**: `/dashboard/projects/[id]/...` with sub-nav for Overview, Submissions, Page Builder, Integration, Analytics, Export, Settings, Upgrade.

## Database migrations

Migrations live in `supabase/migrations/` and are applied **manually** via Supabase SQL Editor (no CLI). The production DB may be out of sync — check missing columns by running the SQL in each migration.

## Docs

- `PRODUCT.md` — product vision, business model, current state
- `DESIGN.md` — design system and component guidance
- `PRODUCTION.md` — production deploy checklist (env vars, webhooks, cron, security)
- `CHANGELOG.md` — milestone history

## Agent instructions

This codebase uses **Next.js 16**, which has breaking changes from earlier versions — APIs, conventions, and file structure may differ from training data. Before writing any code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.
