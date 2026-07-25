# Design System — [PACK]

## World

Warm editorial. Think a refined indie publisher or a boutique creative studio's internal tools — understated but unmistakably intentional. Not cold-minimalist, not playful, not luxurious in the gold-foil sense. The kind of quiet elegance that comes from proportion, pacing, and restraint.

## Mode

- **Landing / Marketing**: Persuade — earn attention and action
- **Dashboard / App**: Operate — scanability, consistency, task completion
- **Pricing**: Persuade — but lean toward the trust of clarity over hype

## Typography

| Role | Font | Weight | Size (desktop) |
|---|---|---|---|
| Display / Hero headings | Instrument Serif | 400 (Regular) | 3.75rem – 5rem |
| Section headings | Instrument Serif | 400 | 1.5rem – 2.25rem |
| UI labels, body, tables | Geist (sans) | 400, 500 | 0.75rem – 1rem |
| Monospace (codes, positions) | Geist Mono | 400 | 0.75rem |

- **Headings**: Instrument Serif for all `h1`/`h2`, and any display-size text. No bold — let the serif's elegance speak at regular weight.
- **Body**: Geist at 400. Keep it crisp and legible for dense UI.
- **Scale**: Use a 1.25 minor third for prose, but let the UI use fixed sizes (xs/sm/base/lg/xl) for consistency.

## Color palette

### Light

| Token | Value | Notes |
|---|---|---|
| `--background` | `oklch(0.985 0.005 75)` | Warm off-white (creamy) |
| `--foreground` | `oklch(0.15 0.008 75)` | Warm near-black |
| `--card` | `oklch(0.99 0.003 75)` | Slightly warmer than bg |
| `--primary` | `oklch(0.35 0.06 25)` | Deep bordeaux-wine |
| `--primary-foreground` | `oklch(0.97 0 0)` | Near-white |
| `--secondary` | `oklch(0.93 0.01 75)` | Warm beige |
| `--accent` | `oklch(0.88 0.015 70)` | Warm tan |
| `--muted` | `oklch(0.95 0.005 75)` | Warm subtle gray |
| `--muted-foreground` | `oklch(0.5 0.01 75)` | Warm mid-gray |
| `--border` | `oklch(0.88 0.008 75)` | Warm light border |
| `--ring` | `oklch(0.35 0.06 25)` | Matches primary |
| `--destructive` | `oklch(0.55 0.18 25)` | Refined red |

### Dark

| Token | Value |
|---|---|
| `--background` | `oklch(0.15 0.008 75)` |
| `--foreground` | `oklch(0.97 0.003 75)` |
| `--card` | `oklch(0.18 0.008 75)` |
| `--primary` | `oklch(0.7 0.04 25)` |
| `--primary-foreground` | `oklch(0.15 0 0)` |
| `--border` | `oklch(0.25 0.008 75 / 0.4)` |
| `--muted` | `oklch(0.22 0.005 75)` |

- **No sidebar-specific tokens.** The sidebar uses the same palette with a `--sidebar-bg: oklch(0.92 0.008 75)` in light mode for subtle differentiation.

## Spacing & Rhythm

- **Page padding**: `p-8` (2rem) instead of `p-6`
- **Section spacing**: `space-y-8` for major sections, `space-y-6` for minor
- **Card padding**: `p-6` inside cards, `p-8` for hero cards
- **Grid gaps**: `gap-6` for page-level grids, `gap-4` for tight groupings
- **Border radius**: keep `--radius: 0.5rem` (8px) — less harsh than the current 10px

## Layout

### Dashboard shell

```
┌──────────────────────────────────────────┐
│ Sidebar (w-60) │   Header (top bar)     │
│                │─────────────────────────│
│  Project list  │                         │
│  ───────────── │   Main content area     │
│  Project 1  ←  │   (flex-1 overflow)     │
│  Project 2     │                         │
│  Project 3     │                         │
│  ───────────── │                         │
│  + New project │                         │
│                │                         │
│  User avatar   │                         │
└────────────────┴─────────────────────────┘
```

- **Sidebar**: w-60 (240px). Lists user's projects by name with a small emoji/icon. Active project highlighted. User profile at bottom. "New project" as a subtle action row.
- **Header**: Slim bar (h-12) with just the user avatar. No title — the page content provides titles.
- **Main**: `p-8` scrollable area.

### Within a project

A project page has its own sub-navigation (tabs or side links) for the tools/sections available. Currently: Subscribers, Analytics, Export, Embed, Settings, Upgrade. These stay as horizontal tabs below the page title.

## Component specific

- **Cards**: No ring/shadow. Just a subtle `background` difference from the page. If a card needs elevation, use a very subtle shadow `0 1px 3px rgba(0,0,0,0.04)`.
- **Buttons**: Keep the `active:translate-y-px` micro-interaction. Primary uses the bordeaux. Secondary uses the warm beige background.
- **Inputs**: Keep current style but use warm border colors.
- **Tables**: Remove `hover:bg-muted/50` — use a more subtle `hover:bg-muted/30` instead. Keep `border-b` rows.

## Anti-patterns (do not)

- No `ring-1 ring-foreground/10` on cards (too sharp for elegant)
- No hard-hover backgrounds on table rows (too aggressive)
- No `shadow-lg` or large shadows — keep shadows minimal
- No emoji as primary icon — use simple SVG or character-based markers
- No `bg-green-50 text-green-800` alert style — use a softer, more refined semantic palette
