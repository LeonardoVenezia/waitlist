# TASKS.md

Pendientes del proyecto. Armado el 6/10/2026 a partir del repo (último push 1/10), los docs y la QA del 30/9-1/10. Lo marcado "sin verificar" no se probó en la app logueada.

## Último check / próximo paso

- **Fecha:** 2026-10-06
- **Último check:** implementados los fixes del bloque A (A.2-A.5) y creada la migración 023. Verificado con `tsc` y `build` OK; smoke test de `/signup`, `/login` y `/pricing` (200). Lint sin errores nuevos (quedan 13 errores pre-existentes en archivos no tocados, ver bloque F). Falta la parte de config (bloque B): aplicar la 023 en cloud, Site URL, env vars y diagnóstico de A.1.
- **Próximo paso:** checklist de config B, pasos 1-5 (empezar por ver qué migraciones están aplicadas). Después, Paddle P0.
- (Actualizar esta sección al cerrar cada sesión: fecha, qué se hizo, qué sigue.)

## Orden sugerido

1. Config sin código (15 min): confirmar en Supabase qué migraciones están aplicadas (020-022 y 001-019); aplicar la migración 023; corregir Site URL; fijar `NEXT_PUBLIC_APP_URL` en Vercel.
2. Fixes chicos de UX/analytics (bloque A abajo) — A.2 a A.5 ya están en código; A.1 es diagnóstico de config.
3. Paddle P0, firma del webhook, antes de activar cualquier plan.
4. Brechas de testimonials vs Senja, en el orden del bloque D.
5. Documentar con AGENTS.md + este archivo y mantenerlos al día.

## A. Bugs de producto

| Estado | Tarea |
|---|---|
| Abierto (config) | Analytics "Signups from page" queda en 0 — sin fix de código, es config/datos. Hipótesis: (a) los eventos anteriores a la migración 021 quedaron con `source='legacy'` y el dashboard solo cuenta `source='hosted'` — se cura solo con signups nuevos; (b) el subscribe atribuye `hosted` solo si `origin`/`referer` matchean `NEXT_PUBLIC_APP_URL` — si la app corre en waitlist.leovenezia.dev pero la env var apunta al dominio vercel.app, todo cae en `api`. Ver checklist B, pasos 4-5 (env var en Vercel + query de eventos por `source`). |
| Resuelto en repo (6/10) | Contadores del form de testimonials (VISITS, RESPONSE RATE) en 0. Causa: la policy RLS de `testimonial_form_visits` (migración 018) joineaba `projects.id = form_id` (debía ir vía `testimonial_forms.project_id`). Fix: migración 023 creada — falta aplicarla en cloud (checklist B, paso 2). INVITES en 0 puede ser legítimo si nunca se enviaron invites. |
| Resuelto en código (6/10) | Preview del form decía "Step 1 of 6" con 8 pasos reales. Causa: la card de la lista (`testimonials/forms/page.tsx`) no pasaba `wizard` a `FormPreviewFrame`, así que los pasos private/consent no aparecían. Fix: parsear `design` y pasar `wizard`. Bonus: el editor ahora usa `variant="editor"`. |
| Resuelto en código (6/10) | Mensaje de URL inválida duplicado: se mostraba inline (input Website) y en el `<p role="alert">` global. Fix: el global excluye `invalidField === "website"` y se unificaron los dos textos de validación en uno. |
| Resuelto en código (6/10) | Signup no avisaba "revisá tu mail": `signUp` redirigía siempre a /dashboard aunque no hubiera sesión (Confirm email ON). Fix: si `!data.session` devuelve `{ checkEmail, email }` y el form muestra "Check your email"; además `emailRedirectTo` ahora preserva el `next`/claim. Verificar con Confirm email ON (checklist B, paso 6). |

## B. Config / infra

| Estado | Tarea |
|---|---|
| Pendiente (manual) | Verificar qué migraciones están aplicadas en la DB cloud (020-022 y 001-019; en el repo no existe 006 — salta de 005 a 007). Aplicar la migración 023 (fix de la policy de `testimonial_form_visits`) — está escrita en el repo, falta correrla en cloud. |
| Pendiente (manual) | Vercel: `NEXT_PUBLIC_APP_URL` = `https://waitlist.leovenezia.dev` (Production). Probable causa de A.1: si apunta al dominio vercel.app, los signups de la página caen en `source='api'`. Redeploy tras el cambio. |
| Abierto | Site URL de Supabase Auth: el link de confirmación redirige a waitlist-nine-pink.vercel.app en vez de waitlist.leovenezia.dev. Configurar Site URL y Redirect URLs (`/auth/callback`). |
| Abierto | Mails de confirmación: branding propio. Con Confirm email ON, decidir ese setting; si el volumen crece, SMTP custom con Resend (el built-in de Supabase tiene rate limit muy bajo). |
| Pendiente | Vercel: env vars de Paddle (client token, price Launch y Grow, webhook secret, API key si se usa). |
| Dejado a propósito | Turnstile apagado, rate limit en memoria. Revisar antes de abrir al público. |

## C. Paddle (ver PADDLE.md)

| Prioridad | Estado | Tarea |
|---|---|---|
| P0 | Abierto | Verificar firma criptográfica del webhook (raw body, header, secreto, timestamp). Tests: válida, firma errónea, body alterado, timestamp vencido. Sin bypass en producción. Bloquea cobros. |
| P1 | Abierto | Downgrade a Free al terminar el período. Decisión tomada (6/10): solo suscripciones canceladas (`cancel_at_period_end`/`canceled`) con `current_period_end` vencido bajan; past_due/paused conservan el plan mientras Paddle reintenta. Patrón a usar: pg_cron + función plpgsql (como la migración 013). Falta definir overflow de subscribers (candidato: `pending_unlock`) y showcase (pasa a expiración de 1 año). |
| P2 | Abierto | Idempotencia de eventos y conflicto por `paddle_transaction_id`. |
| P3 | Abierto | Confirmar entorno sandbox en Paddle.js y probar checkout sandbox. |

## D. Testimonials vs Senja

Meta de Leo: que nadie vea necesario pasarse a Senja. Mínimo para paridad, por impacto:

1. Import de testimonials (sin esto nadie migra).
2. 3-4 widgets distintos (hoy hay uno solo).
3. Wall of Love (página pública).
4. Export de testimonials (hoy solo exporta subscribers).
5. Búsqueda por texto y tags (filtros por estado y form ya existen en la lista de testimonials).
6. Video testimonials, moderación por lote, notificación al owner, métricas por paso.

Ojo con JSON-LD: Google no muestra estrellas para reseñas autopromocionales vía widgets propios. No prometer "estrellas en Google".

## E. Decisiones de Leo (no son tareas de código)

- Nombre del producto (hoy: Startpack / [PACK] en el repo, "Startups Army" en la app, "LaunchList" en `.env.example` y `launchlist.html`).
- Pricing final (plans.ts: Free, Launch $9, Grow $29; PRODUCT.md y plans.ts deben coincidir).
- Foco: software founders vs marcas ecommerce DTC (una landing por vertical, mismo dominio).
- Envío de mails fríos: Zoho limitó la cuenta de leovenezia.dev; hay que repensar el canal.

## F. Deuda técnica

- 13 errores de lint pre-existentes (no introducidos por los fixes del 6/10): 9 `no-explicit-any` (`showcases/[id]/actions.ts`, `showcases/[id]/showcase-form.tsx`, `paddle-init.tsx`) y 2 de react-hooks (`public-waitlist-form.tsx` inmutabilidad, `page.tsx` llama `Date.now` durante render). `pnpm lint` falla por esto; limpiar aparte.

## Hecho

**Hasta 1/10:** Detalle de testimonial con editor, badges y Reject, validación de Website, header mobile, Thank You, /projects/new, migración 020 (se retira el SELECT anónimo a testimonials), docs sincronizados.

**6/10:** Revisión de AGENTS.md y TASKS.md; fixes de bugs A.2-A.5 (migración 023, preview de pasos, error de URL duplicado, pantalla "Check your email") con `tsc`/`build` OK y smoke test de páginas públicas.
