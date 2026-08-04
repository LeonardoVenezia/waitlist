# communication
- Communicate in Spanish (user's native language). Confidence: 0.85
# user-expertise
- User is stronger at frontend than database/backend; provide detailed, step-by-step explanations for database and infrastructure tasks. Confidence: 0.70
# debugging
- When debugging, user prefers to solve root cause rather than bypass or workaround; explicitly rejects temporary bypasses. Confidence: 0.90
- When debugging third-party service issues (e.g., Paddle), user shares the full page HTML/source code rather than describing what they see on screen. Confidence: 0.70
# deployment
- Prefer infrastructure-level configuration (e.g., Cloudflare settings, environment variables) over client-side code changes for fixing deployment/security issues; modifying code unnecessarily can break existing functionality. Confidence: 0.65
# workflow
- Prefers thorough analysis and planning before writing code: expects project exploration, gap analysis, and a structured plan (phases, ordered steps) before any implementation begins. Confidence: 0.80
- Wants implementation work to be documented: expects a clear summary of what was built, which files were created/modified, and what each piece does — not just the code itself. Confidence: 0.80
- Gathers reference material from competitor/peer products (HTML, screenshots, feature lists) to ground planning in concrete examples rather than abstract feature descriptions. Confidence: 0.75
- Verifies code compiles and builds after every change: runs TypeScript type-check (`tsc --noEmit`) and production build (`next build`) as a matter of course before declaring work done. Confidence: 0.70
- Prefers completing and polishing existing features (e.g., responsive design, UX polish) before starting a new major feature or product; values shipping quality over expanding scope prematurely. Confidence: 0.65
