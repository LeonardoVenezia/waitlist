# product-strategy
- The showcase (directory listing) is the core product surface; the project/waitlist overview is secondary. Routing, onboarding flows, and primary CTAs should orient users toward the showcase, not the waitlist management page. Confidence: 0.90
- Directory listings should be permanent, not transient: products remain listed after launch (and get updated), so scarcity should come from early access rather than from the listing being temporary. Rejects positioning the directory as "pre-launch only" because that implies listings disappear after launch. Confidence: 0.85
- Dogfoods their own product: uses their own waitlist as the first real-world deployment to validate the market while continuing to build, and wants it live and working early rather than waiting until everything is finished. Confidence: 0.70
- Operates lean during validation: prefers to stay on free tiers (Vercel Hobby, Supabase free, Resend free) and defer paid infrastructure and branding decisions (custom domain, project name) until market interest is proven. Confidence: 0.65
- Cares that the end-user-facing experience stays clean and native even while validating on free infrastructure: wants a concrete assessment of user-visible roughness (e.g., platform subdomain URLs in referral/hosted links) and how to polish it, not just whether it technically works. Confidence: 0.55
- Positions the directory's core value proposition around discoverability — SEO (search ranking), GEO (Generative Engine Optimization for AI answer engines), and broad visibility — rather than social proof (testimonials) or tooling bundles. Confidence: 0.55
- Directory listings should be ranked by subscription tier — highest plan (Grow) first, then Launch, then Free — and newest-to-oldest within each tier; this ordering must apply consistently across every listing surface (home, all products, launches, coming soon). Confidence: 0.85
- Uses free-plan embed branding as a growth channel: free users' embedded widgets carry a subtle "Made with Startpack" dofollow backlink, while paid plans get the same widget with no branding/link. The SEO backlink is the real goal — the attribution should stay small and understated so it doesn't degrade UX. Confidence: 0.75
# pricing-model
- Prefers one-time payment (not subscription) per project; users pay once for lifetime access to a project. Confidence: 0.75
- New projects require a separate payment; each project starts on a free tier with the option to upgrade via one-time payment. Confidence: 0.70
- Each project bundles all products (currently 1 of 3 planned); the user pays for the whole project, not per product. Confidence: 0.70
- Supports upgrade paths within a project: users who start free can pay to unlock higher tiers later. Confidence: 0.65
- Expects free tiers to retain core delivery functionality (welcome emails reach subscribers even on Free); paid tiers gate premium features — double opt-in/verification and customization (custom sender domain, subject, message, signature, reply-to) — rather than cutting core email delivery entirely. Confidence: 0.80
- The product has exactly three plan tiers: Free, Launch, and Grow. Scale is discontinued and must not exist anywhere — not in pricing, upgrade flow, code, types, DB, or docs; any residual Scale reference is a bug to eliminate, not an option to support. Confidence: 0.85
# navigation
- Back buttons should use browser history (`router.back()`) with a fallback to home (`/`) for users arriving from external sites with no history. Confidence: 0.80
# architecture
- Prefers keeping distinct product features as separate, independent pages/routes (e.g., product detail page vs. waitlist landing) rather than merging them into a unified page; values giving end-users multiple, composable options instead of a single monolithic experience. Confidence: 0.65
# feature-design
- When cloning or referencing a competitor product, expects the agent to apply project-specific judgment to filter which features to include — not blindly replicate everything. The project has its own aesthetic/design criteria; balance simplicity with completeness ("no exagerar la simpleza"). Confidence: 0.70
# onboarding
- Empty states and first-time user experiences must be informative and guide the user — show URLs, actionable steps, and clear next actions rather than leaving new users confused. When the user identifies a UX problem but isn't sure of the best solution, the agent should analyze it deeply and propose a complete UX solution. Confidence: 0.70
# ux-copy
- Prefers plain, self-explanatory labels over marketing or technical jargon. If a label doesn't sound intuitive to a new user, it should be renamed — even common terms like "Referral link" can be confusing when a simpler alternative like "Waitlist URL" or "Your link" exists. Confidence: 0.80
# copy-language
- End-user-facing marketing/landing copy (waitlist pages, directory landing) should be written in English to target an international founder/early-adopter audience, even though communication with the agent happens in Spanish. Confidence: 0.70
# ui-patterns
- Prefers accordion/collapsible patterns for long pages or lists of editable sections: only one section open at a time to keep the interface compact and avoid excessive scrolling. Confidence: 0.75
- Sibling/adjacent sections on the same page should maintain consistent max-width and layout; visual misalignment between sections (e.g., FAQ narrower than How It Works) is noticeable and should be fixed. Confidence: 0.80
- Dislikes column filter/visibility toggles in data tables when they add clutter; prefers showing useful columns (name, country) by default and removing the toggle controls entirely rather than hiding data behind extra buttons. Confidence: 0.60
- Prefers recognizable icon buttons (e.g., a trash can) over abbreviated text labels like "Del" for destructive row-level actions in data tables. Confidence: 0.60
- Wants visible feedback (e.g., a spinner) during async operations so users aren't left waiting with no indication something is happening. Confidence: 0.75
- Rejects native browser `alert()`/`confirm()` dialogs in favor of custom, styled confirmation modals. Confidence: 0.80
- Prefers contained, narrower form controls (e.g., a centered `max-w-sm` form) in hero/landing sections over full-width stretching; finds the more compact layout "más sentido". Confidence: 0.55
- Prefers generous vertical spacing between stacked hero elements (title, subtitle, form input); flags cramped spacing and asks for extra margin rather than accepting the default. Confidence: 0.55
- Prefers subtle visual distinction for status flags (e.g., a "featured" product) — a border or background color tint — over an explicit text badge/tag label; the cue should stay understated. Confidence: 0.75

# feature-design
- When a feature doesn't work end-to-end (saved but never rendered, toggle that doesn't affect output), user prefers removing it entirely rather than leaving dead code in the UI that confuses users. Confidence: 0.75
- When a settings/UI feature exists but isn't actually wired to its effect (disconnected config), the user prefers connecting it so it works end-to-end rather than leaving it dead — removal is the fallback for features not worth wiring up. Confidence: 0.60
- For simple embeddable widgets, prefers minimal configuration surface; rejects over-engineering with options (width, arrangement) that the embedder can control via their own container/CSS. The widget should do one thing well. Confidence: 0.70
- When a product offers multiple integration/embed methods and one is broken (e.g., a legacy cross-origin snippet), prefers deleting the broken method and exposing only the working option(s), while still wanting to hear about any additional viable alternatives rather than a single-method-only answer. Confidence: 0.70
- When a template/theme is selected, it overrides the custom builder and locks structure — the user can only edit content (text, images), and the page builder does nothing while the template is active (clear separation of content vs. layout). Confidence: 0.65

# form-ux
- Cancel/secondary actions should be plain text links, not styled buttons — styled cancel buttons blend in with primary actions and create bad UX ("se camufla"). Confidence: 0.70
- Interactive form controls (field toggles, checkboxes, selectors) must be visually distinct from action buttons (submit, cancel); when they look the same, the form becomes confusing and users can't tell what's a control vs what's an action. Confidence: 0.65
- Slug fields should auto-generate from the name on every keystroke, not just when the slug is empty. The only exception: when editing an already-published resource, the slug should be locked/frozen. Confidence: 0.80
# editor-design
- Form/editor sections should expose all relevant customizable fields directly (title, subtitle, button text, placeholder) rather than burying some settings in other tabs or inheriting them from a separate configuration. Users expect to edit everything about a section in one place. Confidence: 0.80
- Media/image fields should support direct file upload (drag-and-drop or file picker), not just URL pasting. Users expect to upload images from their device rather than finding and pasting external URLs. Confidence: 0.85
- Page builder/editor previews must faithfully mirror the real public rendering (same form fields, input visibility, button width, overlay opacity, typography, and — for templates — the actual template component rather than a placeholder) — the user flags any WYSIWYG discrepancy between preview and live page and expects the preview to be exact, not an approximation. This extends to embeddable widget previews (Integration), which must render the real widget HTML/template via a shared source rather than a Tailwind approximation. Confidence: 0.80
# data-quality
- Values data hygiene: expects signup email validation to block junk/fake entries (invalid formats, disposable domains) so the subscriber database isn't polluted with garbage. Confidence: 0.70
- Dislikes # branding
- Avoids copying a competitor's brand name when building an inspired-by product ("no les voy a robar el nombre"); defers the real naming decision to later (using a temporary placeholder like "LaunchList"), and has now settled on "Startpack" as the product name. Confidence: 0.80
- Uses the product's official brand name "Startpack" consistently; treats leftover competitor/placeholder branding (e.g., `launchlist-widget`) as a bug to rename. Confidence: 0.65
empty/dead columns in data tables; for fields with no data source, prefers either wiring them up properly (e.g., geoIP for Country) or removing them entirely rather than leaving them perpetually blank. Confidence: 0.70
# typography
- Prefers an elegant, high-contrast serif for headings and iterates on it until it feels right — moved from Instrument Serif to Playfair Display and rejected it ("No quedó tan bien como pensé"), settling on Italiana, paired with Geist sans for body text. Confidence: 0.70
f for headings and iterates on it until it feels right — moved from Instrument Serif to Playfair Display and rejected it ("No quedó tan bien como pensé"), settling on Italiana, paired with Geist sans for body text. Confidence: 0.70
om Instrument Serif to Playfair Display and rejected it ("No quedó tan bien como pensé"), settling on Italiana, paired with Geist sans for body text. Confidence: 0.70
