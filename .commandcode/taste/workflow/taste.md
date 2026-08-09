# workflow
- Prefers thorough analysis and planning before writing code: expects project exploration, gap analysis, and a structured plan (phases, ordered steps) before any implementation begins. Confidence: 0.90
- Wants implementation work to be documented: expects a clear summary of what was built, which files were created/modified, and what each piece does — not just the code itself. Confidence: 0.80
- Gathers reference material from competitor/peer products (HTML, screenshots, feature lists) to ground planning in concrete examples rather than abstract feature descriptions. Confidence: 0.75
- Verifies code compiles and builds after every change: runs TypeScript type-check (`tsc --noEmit`) and production build (`next build`) as a matter of course before declaring work done. Confidence: 0.70
- Prefers completing and polishing existing features (e.g., responsive design, UX polish) before starting a new major feature or product; values shipping quality over expanding scope prematurely. Confidence: 0.65
- Prefers security/captcha widgets to be invisible or minimal — dislikes large visible challenge rectangles that clutter forms; values clean, minimal form design. Confidence: 0.60
- Reviews work incrementally and gives feedback one issue at a time rather than in a single large batch; signals upcoming rounds explicitly ("te voy a ir diciendo los detalles que me voy encontrando"). Confidence: 0.60
- Values industry-standard, professional architectural patterns over "it works" workarounds; wants to know how established platforms do it and aligns with those approaches (e.g., presigned URLs over sequential file uploads through the server). Confidence: 0.70
- Disable action buttons (publish, update, unpublish) during async operations like uploads to prevent double-submission and signal that work is in progress. Confidence: 0.75
