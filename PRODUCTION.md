# Guía de producción — Startpack

**Última revisión:** 2026-10-01. Esta guía describe el repo; no certifica que la configuración de Vercel, Paddle o Supabase cloud esté aplicada. Verificá cada checklist en el panel correspondiente.

## Bloqueo antes de cobrar

El webhook de Paddle (`src/app/api/webhooks/paddle/route.ts`) **no valida criptográficamente `paddle-signature`**. Si `PADDLE_WEBHOOK_SECRET` está definida, el código solo exige que el header exista; sin secret, procesa JSON sin firma (modo desarrollo). No habilitar cobros/checkout de producción hasta implementar la verificación oficial y probar firmas válidas e inválidas.

Los detalles y pendientes de billing están en [PADDLE.md](PADDLE.md).

## 1. Deploy y variables

El deploy del repo se hace en Vercel. Confirmá dominio, branch de producción y variables desde el dashboard; no pegues valores secretos en documentación.

| Variable | Uso | Sensibilidad |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | URL base usada por enlaces/forms/widgets | Pública |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente Supabase con RLS | Pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client server-side | **Secreto; nunca `NEXT_PUBLIC_*`** |
| `RESEND_API_KEY` | Envío de email server-side | Secreto |
| `EMAIL_FROM` | Remitente verificado, p. ej. `Startpack <hola@leovenezia.dev>` | Pública/config |
| `CRON_SECRET` | Bearer para `/api/cron/dispatch-emails` | Secreto |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle.js | Pública |
| `PADDLE_API_KEY` | Paddle API si la ruta correspondiente lo usa | Secreto |
| `PADDLE_WEBHOOK_SECRET` | Configurada para webhook; hoy no se valida criptográficamente | Secreto; **no resuelve el bloqueo por sí sola** |
| `PADDLE_PRICE_LAUNCH`, `PADDLE_PRICE_GROW` | Price IDs mensuales | IDs/configuración |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Turnstile, solo al reactivarlo | Site key pública / secret privada |
| `ADMIN_EMAILS` | Lista separada por coma para `/admin/*` | Configuración |

`.env.example` es la lista base. El código revisado no usa `NEXT_PUBLIC_SITE_URL`; usar `NEXT_PUBLIC_APP_URL` salvo que el código cambie.

## 2. Base de datos y migraciones

Las migraciones del repo están en `supabase/migrations/` y se aplican manualmente desde Supabase SQL Editor. No hay confirmación automática de que producción esté al día.

Procedimiento seguro:

1. Revisar qué migraciones ya se aplicaron en el proyecto cloud (historial de migraciones o inspección de esquema/policies).
2. Aplicar solo las pendientes, en orden numérico y en una ventana controlada.
3. Comprobar resultado de cada SQL y verificar columnas, índices, policies, triggers y funciones antes de continuar.
4. No usar `supabase db push` como sustituto del procedimiento acordado sin cambiar esa decisión explícitamente.

En particular, antes del despliegue del cambio de testimonials de octubre 2026, confirmar/aplicar en este orden:

- `020_testimonial_public_access.sql`: elimina la policy de lectura anónima de la tabla `testimonials`. La página de producto y `/w/t/[publicKey]` leen en servidor con service role y proyección allowlisted; el secreto nunca llega al browser.
- `021_page_event_sources.sql`: agrega `page_events.source`; filas existentes quedan `legacy` y no se cuentan como métricas hosted.
- `022_testimonial_consent_confirmation.sql`: agrega usuario/fecha para auditar confirmación de permiso legacy.

**Compatibilidad:** si se despliega el código sin estas migraciones, pueden fallar consultas/insert que usan `source` o campos de consentimiento; no quitar la policy pública de producción hasta que los server renders públicos seguros estén desplegados y probados. Idealmente coordinar el orden con una ventana de deploy y validar las rutas públicas inmediatamente después.

Las migraciones más antiguas también pueden faltar; no asumir que aplicar solo 020–022 alinea toda la base. Revisar `001`–`019` contra el cloud.

## 3. Storage

Las imágenes usan el bucket `showcase-images`. Confirmar en Supabase Storage que exista y que la lectura pública de objetos usados en la web sea intencional. Las rutas de signed upload URL son server-side; nunca exponer el service role. Revisar policies de upload además de que el bucket renderice imágenes.

## 4. Email y cron

- `EMAIL_FROM` debe usar un remitente de dominio verificado en Resend. El código no envía si falta la variable.
- `/api/cron/dispatch-emails` exige `Authorization: Bearer $CRON_SECRET`, procesa hasta 50 filas por request y opera sobre `email_queue`.
- Verificar `email_queue` y los jobs requeridos por las migraciones `013_expire_showcases_job.sql` / `014_email_queue.sql` en el dashboard de Supabase. El código local no comprueba que `pg_cron` esté habilitado ni que los jobs corran.
- Si se configura cron externo/Vercel, usar HTTPS y el header Bearer secreto. No incluir el valor en logs ni en commits.

## 5. Cloudflare / Turnstile

`src/lib/turnstile.ts` define `TURNSTILE_ENABLED = false`. En el estado actual no se renderiza challenge ni se exige token en las rutas relacionadas, aun si existen las variables.

Para reactivarlo: cambiar la constante, cargar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`, configurar hostnames autorizados en Cloudflare y probar waitlist, testimonial submit y uploads. No basta con añadir env vars mientras el switch siga en `false`.

Cloudflare `CF-IPCountry` se usa para país cuando el header existe; la app tolera que falte.

## 6. Seguridad y verificación pre-deploy

- **Paddle:** bloquear cobros hasta verificar firma según protocolo vigente del proveedor; `PADDLE_WEBHOOK_SECRET` presente no significa que la firma esté verificada.
- Confirmar que service role solo exista en env server-side.
- Confirmar policies RLS para tablas con datos de usuario. En particular, testimonials no deben tener SELECT anónimo directo tras migración 020; la salida pública se sirve con columnas permitidas desde servidor y solo para `approved` + `consent='public'`.
- Recordar que el rate limiter actual es in-memory y no distribuido entre instancias.
- Analytics hosted usa `Referer`/`Origin` y slug para atribuir eventos; no es autenticación criptográfica contra spoofing. `legacy` se excluye de métricas hosted.

## 7. Checklist

### Antes del deploy

- [ ] `pnpm exec tsc --noEmit` y `pnpm build` pasan.
- [ ] Confirmar diferencias entre el historial DB cloud y `supabase/migrations/`.
- [ ] Aplicar migraciones pendientes; si corresponde, revisar 020–022 y la secuencia de deploy antes de retirar acceso público.
- [ ] Verificar env vars en Vercel usando `.env.example` como referencia; secretos solo server-side.
- [ ] Revisar bucket/policies de `showcase-images`.
- [ ] Probar `/p/[slug]`, signup/referral, `/product/[slug]`, `/t/[formSlug]`, archivo de form, testimonials públicos y widget en host externo.
- [ ] Verificar cron de expiración/queue y remitente Resend en los dashboards externos.

### Antes de habilitar cobros

- [ ] Implementar y probar validación criptográfica del webhook Paddle para firmas válidas, inválidas y timestamps fuera de tolerancia.
- [ ] Configurar webhook y eventos necesarios en Paddle, con precio/entorno correctos.
- [ ] Ejecutar checkout sandbox y comprobar activación/actualización de plan, periodo, cancelación y errores de entrega.
- [ ] Definir/probar downgrade al finalizar periodo cancelado; revisar estado actual en `PADDLE.md`.

## Documentos relacionados

- [Contexto técnico](.commandcode/contexto-proyecto.md)
- [Producto](PRODUCT.md)
- [Pendientes de Paddle](PADDLE.md)
- [Changelog](CHANGELOG.md)
