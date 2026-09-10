# Paddle — Pendientes de integración

Estado al 2026-08-29. Auditoría de la integración de pagos. Lo que está funcionando y lo que falta, para retomar con contexto.

## Lo que ya funciona

- **Checkout**: Paddle.js carga solo en `/dashboard/projects/[id]/upgrade` con `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`. El checkout pasa `custom_data` (`account_id`, `waitlist_id`, `plan`) que el webhook lee.
- **Price IDs** por env var (`PADDLE_PRICE_LAUNCH`, `PADDLE_PRICE_GROW`), no hardcodeados.
- **Webhook** (`src/app/api/webhooks/paddle/route.ts`) maneja `subscription.created/updated` (upsert en `subscriptions`, activa plan, desbloquea subscribers `pending_unlock`, re-publica showcase expirado), `subscription.canceled/paused/past_due`, y el legacy `transaction.completed`.
- **Límites**: subscribe API aplica `getWaitlistLimit(plan)` (100/1000/10000) con overflow como `pending_unlock`. Los `PLAN_LIMITS` del webhook matchean `plans.ts`.
- **UX de cancelación**: upgrade page muestra "Plan actual" y linkea al portal de cliente de Paddle.

## Pendientes de código (por prioridad)

### 1. CRÍTICO — Verificación de firma del webhook no implementada

`src/app/api/webhooks/paddle/route.ts` (función `readVerifiedPayload`): si `PADDLE_WEBHOOK_SECRET` está seteada, solo se chequea que el header `paddle-signature` **exista**, no que la firma sea válida (TODO explícito en el código).

**Riesgo**: cualquiera puede POSTear un payload falso a `/api/webhooks/paddle` y activarse Grow gratis. Explotable en producción hoy.

**Fix**: implementar verificación ed25519. El header trae `ts=<timestamp>;h1=<signature>`; el secret de Paddle webhook es una clave pública que se usa para verificar el HMAC del `raw body` + timestamp. Referencia: PRODUCTION.md "Paso 6" y docs de Paddle (verificación de webhooks).

### 2. ALTO — No hay downgrade cuando la suscripción termina

`subscription.canceled` solo marca la fila `subscriptions` como canceled. **Nadie vuelve el proyecto a `free`** cuando `current_period_end` pasa. No existe cron de suscripciones vencidas.

**Riesgo**: un founder que cancela conserva Launch/Grow para siempre. Fuga de ingresos silenciosa.

**Fix propuesto**: cron diario (pg_cron o el endpoint cron existente) que:
1. Busque suscripciones `canceled` con `current_period_end < now()`.
2. Downgrade del proyecto a `free` (plan + `submission_limit` 100).
3. Setee `expires_at = now() + 1 año` en el showcase (coherente con el ciclo Free) o lo marque expired directo — decidir cuál es el comportamiento de producto deseado.
4. Vuelva los subscribers que excedan 100 a `pending_unlock`.
5. Encole email al founder avisando el downgrade.

### 3. BAJO — Idempotencia de `transaction.completed`

Inserta en `purchases` sin chequear duplicados; el unique constraint de `paddle_transaction_id` rechaza con 500 y Paddle reintenta infinito. Devolver `ok: true` si la transacción ya existe.

### 4. BAJO — Sin entorno sandbox

No hay `Paddle.Environment.set("sandbox")` en `PaddleInit`. Solo funciona con token de producción. Agregar rama sandbox (ej. `NEXT_PUBLIC_PADDLE_ENV=sandbox`) para poder probar checkouts sin cobrar.

### 5. COSMÉTICO — Polling en PaddleInit

`paddle-init.tsx` usa `setInterval` de 200ms esperando `window.Paddle` en vez del callback `onLoad` de `next/script`. Funciona, pero es el antipatrón que ya se eliminó en otro lado.

## Pendientes fuera del código (responsabilidad de Leo)

- [ ] Verificar env vars en Vercel: `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRICE_LAUNCH`, `PADDLE_PRICE_GROW`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`. Si falta el client token, los botones de upgrade quedan en "Cargando..." para siempre.
- [ ] Dashboard de Paddle: webhook configurado apuntando a `https://waitlist.leovenezia.dev/api/webhooks/paddle` con los eventos `subscription.created`, `subscription.updated`, `subscription.canceled`, `subscription.paused`, `subscription.past_due`, `transaction.completed`.
- [ ] Catálogo: confirmar que los prices sean de tipo **suscripción** (mensual) y que el producto esté aprobado/en vivo en Paddle.
- [ ] Prueba end-to-end: un checkout real (o sandbox una vez implementado el punto 4) confirmando que el webhook llega y el plan se activa en la DB.

## Orden sugerido al retomar

1. Fix de firma (1) — único explotable ahora mismo.
2. Downgrade cron (2) — dinero perdiéndose silenciosamente.
3. Config en Paddle dashboard + prueba E2E.
4. 3/4/5 en cualquier momento.
