# Startpack

Startpack combina un directorio público de productos con herramientas por proyecto: showcase, waitlist/referrals, landing builder y collection/moderación de testimonials. La propuesta y las capacidades vigentes están en [PRODUCT.md](PRODUCT.md); el contexto técnico para retomar sesiones vive en [.commandcode/contexto-proyecto.md](.commandcode/contexto-proyecto.md).

## Stack

- Next.js 16.2 (App Router), React 19, TypeScript 5
- Supabase (auth, Postgres, storage)
- Tailwind CSS v4
- Resend (email), Paddle (billing), Cloudflare Turnstile (actualmente apagado por kill switch)

## Desarrollo local

```bash
pnpm install
pnpm dev
```

Comandos disponibles en `package.json`:

```bash
pnpm build
pnpm start
pnpm lint
pnpm exec tsc --noEmit
```

Variables de entorno: `.env.example`. No copies secretos al cliente ni a variables `NEXT_PUBLIC_*`; `SUPABASE_SERVICE_ROLE_KEY` es server-only.

## Arquitectura breve

- Modelo: `account` → `project`; proyecto agrupa waitlist/showcase y sus herramientas.
- El directorio vive en `/`, `/products`, `/launches`, `/coming-soon` y `/product/[slug]`.
- Waitlist hosted: `/p/[slug]`; embeds de waitlist y testimonials: `/w/e/[publicKey]` y `/w/t/[publicKey]`.
- Forms de testimonials: `/t/[formSlug]` y `/t/[formSlug]/embed`.
- Dashboard: `/dashboard/projects/[id]/...`.
- Supabase SQL está versionado en `supabase/migrations/`; revisar `.commandcode/contexto-proyecto.md` y `PRODUCTION.md` antes de tocar/escalar DB. El repo no demuestra qué migraciones llegaron a cloud.

## Documentación

- [Contexto técnico](.commandcode/contexto-proyecto.md) — onboarding, rutas, arquitectura, privacidad y límites actuales.
- [Producto](PRODUCT.md) — propuesta, planes y capacidades de cara al usuario.
- [Diseño](DESIGN.md) — lenguaje visual y componentes.
- [Producción](PRODUCTION.md) — variables, migraciones manuales, cron y checklist operativo.
- [Paddle](PADDLE.md) — flujo de pagos, riesgo de webhook y pendientes.
- [Changelog](CHANGELOG.md) — historial de cambios; no es fuente de verdad del estado actual.

## Nota de seguridad

La service role de Supabase solo se utiliza desde el servidor. El webhook Paddle todavía no valida criptográficamente la firma; no habilitar cobros en producción hasta resolver y probar ese bloqueo. Los testimonials solo son públicos con estado aprobado y consentimiento público explícito.
