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

- **Headings**: Italiana (loaded as `--font-heading`) at `font-semibold` for every `h1`–`h4`. Declared **once** in `globals.css`'s base layer so all headings inherit it — don't re-declare a weight per component, and don't override it unless a surface deliberately opts out. (Italiana ships only weight 400, so the bold is browser-synthesized.)
- **Template surfaces opt out of the heading family.** Every template renders inside a `data-surface="template"` wrapper, where a base-layer rule resets `h1`–`h4` to `font-family: inherit` so the app's serif never leaks into a template's own world. Utility classes still win (later layer), so a template declares its own family: Editorial, Split and Aurora use `font-heading`, Mono uses `font-sans`, and Neon / Carbon / Pastel inherit Geist. New templates are protected automatically.
- **Body**: Geist at 400. Keep it crisp and legible for dense UI.
- **Scale**: Use a 1.25 minor third for prose, but let the UI use fixed sizes (xs/sm/base/lg/xl) for consistency.

## Color palette

### Light

| Token | Value | Notes |
|---|---|---|
| `--background` | `oklch(0.985 0.004 85)` | Warm off-white (creamy) — `#fbfaf7` |
| `--foreground` | `oklch(0.18 0.01 80)` | Warm near-black — `#14110d` |
| `--card` | `oklch(0.99 0.002 85)` | Slightly lighter than bg — `#fcfcfa` |
| `--primary` | `oklch(0.48 0.19 70)` | **Rust-orange** (`#9d3e00`) — the one brand accent |
| `--primary-foreground` | `oklch(0.98 0.005 85)` | Near-white |
| `--secondary` | `oklch(0.92 0.015 80)` | Warm beige — `#eae4da` |
| `--accent` | `oklch(0.88 0.04 70)` | Warm tan — `#e9d4bc` |
| `--muted` | `oklch(0.95 0.008 85)` | Warm subtle gray — `#f1eee9` |
| `--muted-foreground` | `oklch(0.45 0.015 80)` | Warm mid-gray — `#5a554c` |
| `--border`, `--input` | `oklch(0.87 0.012 80)` | Warm light border — `#d8d3cc` |
| `--ring` | `oklch(0.48 0.19 70)` | Matches primary |
| `--destructive` | `oklch(0.52 0.2 25)` | Refined red — `#c21725` |
| `--coming-soon` | `oklch(0.55 0.16 45)` | Amber badge — `#b94a00` |
| `--success` | `oklch(0.55 0.14 150)` | Green — `#1c8742` |

- **`globals.css` is the source of truth.** These rows are transcribed from `:root`; when the palette changes, update this table in the same commit. The brand accent was historically written up as "bordeaux" (`#7a3325`) but the shipped token is the rust-orange above — three different terracottas (`#9d3e00`, `#562d2a`, `#7a3325`) have coexisted, so always take the value from the token.

### Dark

**Not wired up.** `.dark` is fully defined in `globals.css`, but nothing ever applies the class (no toggle, no `prefers-color-scheme`), so these values are unreachable today. Documented for whoever turns it on — and it is why templates must hardcode their own surface (see **Templates**).

| Token | Value |
|---|---|
| `--background` | `oklch(0.14 0.01 80)` |
| `--foreground` | `oklch(0.94 0.003 85)` |
| `--card` | `oklch(0.17 0.008 80)` |
| `--primary` | `oklch(0.65 0.16 70)` |
| `--primary-foreground` | `oklch(0.14 0.01 80)` |
| `--muted` | `oklch(0.22 0.008 80)` |
| `--muted-foreground` | `oklch(0.6 0.01 80)` |
| `--border` | `oklch(0.25 0.01 80 / 0.4)` |

- **No sidebar-specific tokens.** The sidebar is just `<aside className="… border-r bg-card">` — it uses the shared palette like any other surface.

### Templates

A template is a **replacement visual world**, not a themed surface: the user picks one precisely to leave the app's identity behind. So templates are the single place that deliberately does **not** use the app tokens — inheriting `--primary` or `--background` would erase the reason the template exists. (The template files already state this themselves: Neon's comment says it "deliberately does NOT use the host app's tokens", and Pastel's describes its palette as "explicitly NOT" the app's.) What a template owes in exchange:

- **Explicitness.** Declare your own colors *and* typography inside the template. Never inherit them from the app — that is the bug that silently put Italiana in Neon, Carbon and Pastel's headlines (see **Typography**).
- **Coherence.** One neutral ramp — `zinc` for cool, `neutral` for warm — plus **one** accent hue. A second hue is allowed only as a deliberate pair (Carbon's emerald + cyan), never as an ad-hoc grab bag.
- **Contrast (WCAG AA).** Every text/background pair clears **4.5:1** for body and label text, and **3:1** for large text (≥24px, or ≥18.66px bold). Inactive/disabled controls are exempt; placeholders are not, because low-contrast hint text is exactly what low-vision users can't read. This includes text over a template's own decoration: white type over a light gradient cannot pass on its own, which is why Aurora puts a scrim between its gradient and its content, and tints its glass ink rather than white.
- **Immunity.** A template must render correctly regardless of ambient state. Nothing applies `.dark` today, but a template built on `text-foreground` would invert the day a theme toggle ships — hardcoding its own surface is what keeps it safe.

Everything outside a template — dashboard, public shells, forms, empty states — uses the tokens, as always.

### Emails

Transactional email is a third surface, and the most constrained one: clients strip CSS variables, don't understand `oklch()`, drop gradients, ignore stylesheets, and can't load Geist or Italiana. So an email never derives its look from the app tokens or from a template's Tailwind classes — it renders from a flat, all-hex `EmailBrand`.

- **Which brand.** Emails about the waitlist carry the waitlist's design, resolved in the same order as `/p/[slug]` (template → custom sections → branding). Other project emails carry the project's `branding` (logo + primary color). Platform emails — account, admin, lifecycle — carry the app brand, which is the single copy of the accent in email (`EMAIL_FONTS`/`APP_EMAIL_BRAND` in `src/lib/email-brand.ts`).
- **Curated, not copied.** Each template declares an `emailPalette` next to its `thumbnail`. The values are chosen so every text/background pair clears AA — the page classes do not: white on Neon's `#22c563` is 2.27:1.
- **Dark templates are adapted.** Neon and Carbon keep their accent and their mono labels on a light page; dark transactional email renders badly in clients that force their own dark mode.
- **Fonts are approximated.** A template's type character is suggested with a system stack (sans / mono / Georgia), never reproduced exactly.
- Colors are always inline, the background sits on a wrapper `<table>` rather than `<body>`, and the document declares `color-scheme: light only` so clients don't invert the design.

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
- **Buttons**: Keep the `active:translate-y-px` micro-interaction. Primary uses the rust accent (`--primary`). Secondary uses the warm beige background.
- **Inputs**: Use the `Input` component (with optional `leftIcon`/`rightIcon` slot). For selects use `Select`, for checkboxes use `Checkbox`, for radios use `RadioGroup`, for textareas use `Textarea`. All share the same warm border colors and focus state.
- **Tables**: Remove `hover:bg-muted/50` — use a more subtle `hover:bg-muted/30` instead. Keep `border-b` rows.
- **Icons**: Always use the SVG `Icon` components from `@/components/ui/icon`. Stroke 1.5, currentColor. Never use native emoji as UI chrome.
- **Placeholders for products without images**: Use `ProductPlaceholder` (initials in `font-heading` over the muted background) — both `sm` (40×40) and `md` (16:9) sizes.
- **Multi-step forms (testimonial wizard)**: the public form is a bare, full-height centered column (`max-w-xl`) with the form name as a serif masthead — no card, the whitespace does the framing. Thin progress bar (`bg-primary` over `bg-muted`), step title in `font-heading` at `text-2xl/3xl`. Nav stacks vertically and centers: full-width primary CTA on top, plain-text "Back" below (never side by side, never a styled secondary button). Choice steps use custom-styled option rows — bordered container + filled dot — instead of native radios. The rating step starts empty (all stars `text-border`) and is required to continue; hover fills up to the cursor, click commits. Image steps use `ImageUpload` (`variant="avatar"`). The thank-you echoes the testimonial back using the same `TestimonialCard` the owner sees, with the reward code below as a dashed-border ticket. Errors are inline text with `role="alert"`, never `alert()`.

## Anti-patterns (do not)

- No `ring-1 ring-foreground/10` on cards (too sharp for elegant)
- No hard-hover backgrounds on table rows (too aggressive)
- No `shadow-lg` or large shadows — keep shadows minimal
- **No emoji as UI chrome** (sidebar, page builder, tabs, status pills, placeholders, form labels). Emojis may appear in copy/onboarding copy where they add warmth, but never as icons or status indicators.
- No `bg-green-50 text-green-800` alert style — use a softer, more refined semantic palette
- No raw `<select>`, `<input type="checkbox">`, `<input type="radio">`, or `<input type="date">` in the dashboard or public pages — use the `Select`, `Checkbox`, `RadioGroup`, `Input` components.
- No **app tokens** (`text-foreground`, `bg-primary`, `border-border`, `bg-card`, `bg-muted`…) inside a template, and no app-level typography inherited by one — a template owns its world (see **Color palette → Templates**). Corollary: Tailwind's `zinc`/`neutral` ramps are **not** banned in templates; they are exactly the neutral base a template builds on.
