# AGENTS.md

Guía corta para el agente de código. Leé esto primero, después TASKS.md.

## Qué es

Startpack (nombre provisorio, también aparece [PACK] / "Waitlist"): directorio público de productos con herramientas por proyecto: showcase, waitlist con referrals, page builder y testimonials. Un proyecto es la unidad: account → project.

## Stack

Next.js 16 (App Router), React 19, TypeScript 5, Supabase (auth, Postgres, storage), Tailwind v4, Resend (mail), Paddle (pagos), Cloudflare Turnstile (hoy apagado por kill switch). Deploy en Vercel.

## Cómo correrlo

```bash
pnpm install
pnpm dev
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Variables en `.env.example`. Nunca pongas secretos en `NEXT_PUBLIC_*`. `SUPABASE_SERVICE_ROLE_KEY` es solo server.

## Dónde está el contexto

- `PRODUCT.md`: qué hace el producto, planes, flujos.
- `.commandcode/contexto-proyecto.md`: mapa técnico, rutas, arquitectura, privacidad.
- `PADDLE.md`: estado de pagos y pendientes.
- `PRODUCTION.md`: env vars, migraciones, checklist de deploy.
- `DESIGN.md`: sistema visual.
- `CHANGELOG.md`: historial, no es fuente de verdad del estado actual.
- `TASKS.md`: pendientes y próximo paso.

## Reglas

1. Antes de tocar algo, confirmá el estado en el código. Los docs pueden estar atrasados.
2. Migraciones SQL: no ejecutes ninguna sin comprobar qué ya está aplicado en cloud. El repo no lo demuestra.
3. Paddle: no habilitar cobros live hasta resolver la firma del webhook (ver PADDLE.md, P0).
4. Testimonials: solo se publican los `approved` con `consent='public'`. No cambies eso.
5. Una feature a la vez, con criterios de aceptación escritos en TASKS.md antes de empezar.
6. Verificá lo que hacés: `tsc`, `lint`, build, y probalo en la app. No des algo por hecho sin verlo funcionar. Si agregás tests (Playwright, RLS de Supabase), no los saltees ni aflojes los asserts para que pasen.
7. Los strings de marca ([PACK], Startpack, Startups Army, LaunchList) son placeholders hasta definir el nombre. No son bugs.
8. **Al terminar cada sesión, actualizá TASKS.md**: estado de lo que tocaste y la sección "Último check / próximo paso" con fecha. No cierres sin hacerlo.
