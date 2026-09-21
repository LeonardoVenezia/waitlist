/**
 * Master switch for Cloudflare Turnstile.
 *
 * While `false`, the captcha is skipped everywhere:
 *   - client widgets are not rendered and no challenge is executed
 *     (testimonial wizard, waitlist hosted form, page-builder templates)
 *   - the Turnstile script is not loaded on `/p/*`
 *   - server routes stop requiring/validating a token
 *     (`/api/public/subscribe`, `/api/testimonials/submit`,
 *      `/api/testimonials/upload-url`)
 *
 * TO RE-ENABLE: flip this to `true` and make sure both env vars are set —
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (client) and `TURNSTILE_SECRET_KEY` (server).
 * No other change is needed.
 */
export const TURNSTILE_ENABLED = false;
