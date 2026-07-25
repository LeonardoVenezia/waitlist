# Product: [PACK]

## Core proposition

A founder pays once and gets a **suite of pre-launch tools** for their project: waitlist, coming-soon page, landing page builder, and more (3-4 tools planned). One-time payment per project, not per tool.

## Business model

- **Per-project pricing**: Free (150 leads), Launch ($29, 500), Grow ($79, 10k), Scale (custom)
- One payment unlocks **all current and future tools** for that project
- A user can have multiple projects, each on its own plan
- Payments via Paddle (one-time, not subscription)

## Users

- **Founders / indie hackers** building pre-launch hype
- Currently MVP: single waitlist tool per project, but architecture must support multiple tools

## Key flows

1. **Create project** → gets a waitlist (first tool). More tools added later.
2. **Share waitlist** → widget embed, hosted page, referral links
3. **Grow** → subscribers join via referrals, leaderboard, analytics
4. **Upgrade** → one-time payment per project to unlock higher limits + features
5. **Manage** → settings (branding, form, notifications), subscriber management

## Current state

- MVP with waitlist-only tool
- DB model: account → waitlists (each waitlist = one project)
- Purchases are per-waitlist but conceptually should be per-project
- Multi-project UX not implemented (sidebar shows tools, not projects)
- Visual identity is monochrome sans-serif — needs to evolve toward elegant/serif

## Design principles (draft)

- Elegant, refined, type-led (serif for headings)
- Understated but warm — not minimalist-cold
- Trustworthy for a paid product
- Operate mode for dashboard (task completion), Persuade for landing
