# pricing-model
- Prefers one-time payment (not subscription) per project; users pay once for lifetime access to a project. Confidence: 0.75
- New projects require a separate payment; each project starts on a free tier with the option to upgrade via one-time payment. Confidence: 0.70
- Each project bundles all products (currently 1 of 3 planned); the user pays for the whole project, not per product. Confidence: 0.70
- Supports upgrade paths within a project: users who start free can pay to unlock higher tiers later. Confidence: 0.65
# navigation
- Back buttons should use browser history (`router.back()`) with a fallback to home (`/`) for users arriving from external sites with no history. Confidence: 0.80
# architecture
- Prefers keeping distinct product features as separate, independent pages/routes (e.g., product detail page vs. waitlist landing) rather than merging them into a unified page; values giving end-users multiple, composable options instead of a single monolithic experience. Confidence: 0.65
# feature-design
- When cloning or referencing a competitor product, expects the agent to apply project-specific judgment to filter which features to include — not blindly replicate everything. The project has its own aesthetic/design criteria; balance simplicity with completeness ("no exagerar la simpleza"). Confidence: 0.70
# form-ux
- Cancel/secondary actions should be plain text links, not styled buttons — styled cancel buttons blend in with primary actions and create bad UX ("se camufla"). Confidence: 0.70
- Interactive form controls (field toggles, checkboxes, selectors) must be visually distinct from action buttons (submit, cancel); when they look the same, the form becomes confusing and users can't tell what's a control vs what's an action. Confidence: 0.65
