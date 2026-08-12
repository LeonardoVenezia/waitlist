# security
- User is security-conscious and proactively verifies that sensitive operations (admin clients, service role keys, signed URL generation) are server-side only and never exposed to the client. Expects explicit confirmation of security boundaries when architectural changes touch auth/credentials. Confidence: 0.70
- When a feature would create a security burden the user isn't equipped to manage (e.g., custom code injection, raw HTML/CSS/JS from untrusted sources), user prefers removing the feature preemptively rather than trying to secure it. Confidence: 0.70
# communication
- Communicate in Spanish (user's native language). Confidence: 0.85
- Agent should proactively ask for needed information (reference material, clarifications) rather than making assumptions or proceeding with incomplete context. Confidence: 0.75
# user-expertise
- User is stronger at frontend than database/backend; provide detailed, step-by-step explanations for database and infrastructure tasks. Confidence: 0.70
# debugging
- When debugging, user prefers to solve root cause rather than bypass or workaround; explicitly rejects temporary bypasses. Confidence: 0.90
- When debugging third-party service issues (e.g., Paddle), user shares the full page HTML/source code rather than describing what they see on screen. Confidence: 0.70
# deployment
- Prefer infrastructure-level configuration (e.g., Cloudflare settings, environment variables) over client-side code changes for fixing deployment/security issues; modifying code unnecessarily can break existing functionality. Confidence: 0.65
# product
See [product/taste.md](product/taste.md)
# workflow
See [workflow/taste.md](workflow/taste.md)
