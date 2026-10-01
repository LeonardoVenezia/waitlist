# Paddle — Estado de integración y pendientes

**Revisado:** 2026-10-01. Este documento separa el comportamiento visto en el repo de la configuración que debe verificarse en Paddle/Vercel.

## Flujo que existe en el código

- Checkout se inicia desde `/dashboard/projects/[id]/upgrade` con `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`.
- Prices Launch/Grow se leen de `PADDLE_PRICE_LAUNCH` y `PADDLE_PRICE_GROW`.
- `custom_data` lleva `account_id`, `waitlist_id` (ID de `projects`) y `plan`.
- `src/app/api/webhooks/paddle/route.ts` maneja `subscription.created`/`updated`: hace upsert en `subscriptions`, asigna el plan si la suscripción queda activa, actualiza límite, desbloquea suscriptores `pending_unlock` y vuelve a publicar showcases expirados.
- `subscription.canceled` registra estado/fin de periodo, pero no hace downgrade del proyecto en ese handler. `paused` y `past_due` actualizan el registro de suscripción.
- `transaction.completed` permanece como ruta legacy para transacciones históricas; nuevas altas deben entrar por eventos de suscripción.

Los IDs de precio, token, URL del webhook, eventos habilitados y entorno real deben comprobarse en los dashboards externos; la existencia de las env vars no demuestra que Paddle esté configurado correctamente.

## Bloqueo crítico: firma del webhook

En `readVerifiedPayload()` el código:

1. Lee el body sin procesar y el header `paddle-signature`.
2. Si `PADDLE_WEBHOOK_SECRET` está ausente, parsea JSON sin verificación (modo desarrollo).
3. Si la variable está presente, solo exige que el header no esté vacío y luego parsea JSON. **No calcula ni verifica una firma criptográfica.**

Por lo tanto, configurar la variable y recibir un header no protege el endpoint. No habilitar cobros de producción hasta implementar la verificación exactamente según la documentación/protocolo vigente de Paddle y probar eventos válidos, firma inválida, body modificado y timestamp fuera de tolerancia. No asumir que el secreto es HMAC o Ed25519: confirmar el algoritmo/formato oficial vigente al implementar.

## Pendientes de código

### P0 — Verificar firma antes de procesar eventos

- Implementar verificación criptográfica usando el raw body, header y secreto/formato oficial de Paddle.
- Rechazar firma ausente/inválida y timestamps expirados; cubrir replay/idempotencia según protocolo.
- Añadir pruebas de evento válido, firma errónea, body alterado y timestamp fuera de tolerancia.
- Mantener cualquier bypass solo en entorno local no productivo, sin que `NODE_ENV=production` pueda aceptarlo por falta de secreto.

### P1 — Downgrade al final del periodo

El evento cancelado marca `subscriptions.status='canceled'`, pero no se observa una rutina que, cuando `current_period_end < now()`, cambie proyecto a Free. Definir y luego implementar el comportamiento de showcase y waitlist al expirar:

- plan y límite de submissions;
- subscribers por encima de límite (`pending_unlock` u otra política de producto ya acordada);
- expiración/reactivación del showcase;
- comunicación al owner.

No ejecutar ni documentar como existente hasta que haya código/job y prueba.

### P2 — Idempotencia / manejo de estados

- Revisar retries de Paddle y eventos duplicados para que todos los handlers sean idempotentes y devuelvan 2xx para eventos ya aplicados.
- El insert legacy de `transaction.completed` debe manejar conflicto por `paddle_transaction_id` sin provocar retries permanentes.
- Probar transición `past_due`, `paused`, `canceled`, reactivación y cambio de plan con eventos reales de sandbox.

### P3 — Sandbox

Confirmar si Paddle.js recibe el entorno esperado para pruebas; si no, exponer configuración no secreta y probar checkout sandbox antes de cualquier cobro real.

## Pendientes externos (verificar manualmente)

- [ ] Vercel: `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `PADDLE_PRICE_LAUNCH`, `PADDLE_PRICE_GROW`, `PADDLE_WEBHOOK_SECRET` y `PADDLE_API_KEY` si la integración la utiliza.
- [ ] Paddle: webhook apunta al endpoint de producción y tiene habilitados eventos subscription `created`, `updated`, `canceled`, `paused`, `past_due` y cualquier evento necesario para la transición de estado.
- [ ] Confirmar que el catálogo usa los precios/planes correctos y entorno Live/Sandbox correcto.
- [ ] No habilitar transacciones Live hasta completar P0.
- [ ] Después del fix, realizar checkout sandbox y revisar logs/respuesta del webhook y cambios DB.

## Orden recomendado

1. Implementar y probar verificación de firma (bloquea cobros).
2. Revisar/definir ciclo de cancelación y downgrade con comportamiento de producto.
3. Endurecer idempotencia y transiciones.
4. Validar env/configuración del dashboard Paddle y completar E2E sandbox.
5. Activar cobros solo cuando el P0 esté desplegado y probado.

## Referencias locales

- Handler: `src/app/api/webhooks/paddle/route.ts`
- Planes/feature gates: `src/lib/plans.ts`
- Checkout UI: `src/app/dashboard/projects/[id]/upgrade/`
- Runbook general: `PRODUCTION.md`
