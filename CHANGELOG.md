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
