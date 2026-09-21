# security
- User is security-conscious and proactively verifies that sensitive operations (admin clients, service role keys, signed URL generation) are server-side only and never exposed to the client. Expects explicit confirmation of security boundaries when architectural changes touch auth/credentials. Confidence: 0.70
- Codebase pattern for Supabase writes: use `createClient()` (RLS-protected) for reads and `createAdminClient()` (service role) for INSERT/UPDATE/DELETE, always verifying resource ownership via an RLS-protected read before performing the admin write so service-role access doesn't open a security hole. Confidence: 0.70
- When a feature would create a security burden the user isn't equipped to manage (e.g., custom code injection, raw HTML/CSS/JS from untrusted sources), user prefers removing the feature preemptively rather than trying to secure it. Confidence: 0.70
# communication
- Communicate in Spanish (user's native language). Confidence: 0.85
- Agent should proactively ask for needed information (reference material, clarifications) rather than making assumptions or proceeding with incomplete context. Confidence: 0.75
- When the user shares external advice/content (blog posts, Reddit threads, AI design reviews), they want a critical, contextualized verdict on what actually applies to their stack and stage — separating relevant points from generic or irrelevant ones — rather than blanket acceptance of the advice. Confidence: 0.60
- When the user shares a long external report (e.g., a multi-page design review), the agent should treat it as input to evaluate, not as a task list to execute verbatim — should map each finding against the actual codebase, agree/disagree with judgment, and surface real decisions back to the user. Confidence: 0.80
- When the user asks for a feature description to hand off to an external tool (e.g., "una IA de negocio" for business analysis), the agent's output is used as raw paste material elsewhere: write it self-contained and business-oriented — how the feature works from the founder/end-user perspective (flow, moderation rules, plan limits), current status, and pending future items — with no internal implementation details (file paths, migration names, code identifiers). Confidence: 0.65
# user-expertise
- User is stronger at frontend than database/backend; provide detailed, step-by-step explanations for database and infrastructure tasks. Confidence: 0.75
# debugging
See [debugging/taste.md](debugging/taste.md)
# deployment
- Prefer infrastructure-level configuration (e.g., Cloudflare settings, environment variables) over client-side code changes for fixing deployment/security issues; modifying code unnecessarily can break existing functionality. Confidence: 0.65
- Prefers keeping each platform in its natural role (Vercel for Next.js hosting, Cloudflare for DNS/CDN/proxy) rather than consolidating onto a single provider; values simple, low-maintenance infrastructure and avoids migrations that add complexity or break existing features. Confidence: 0.65
# third-party-services
- Wants to understand the operational limits, failure modes, and production-readiness (rate limits, ToS, cost) of third-party services before relying on them — specifically asks what the limits are and what happens when they're exhausted, expecting graceful degradation rather than silent breakage of core flows. Confidence: 0.60
- Prefers free, infrastructure-native alternatives already available in the existing stack (e.g., Cloudflare's CF-IPCountry header) over adding third-party APIs that carry rate limits, cost, or production restrictions. Confidence: 0.70
- Prefers transactional/notification emails to be sent from their own branded, provider-verified domain (e.g., leovenezia.dev) rather than a generic or placeholder sender address. Confidence: 0.60
# performance
- Cares about upload payload weight: when an image only ever renders small (author photo or company logo shown at ~40px), it should be downscaled + recompressed (e.g. WebP) in the browser before upload rather than shipping the original 3–8 MB phone photo. Expects the input size cap to be raised accordingly (2 MB → 12 MB) so a normal phone photo actually works, while surfaces that need full resolution (page-builder images) stay untouched. Confidence: 0.70
# product
See [product/taste.md](product/taste.md)
# workflow
See [workflow/taste.md](workflow/taste.md)
