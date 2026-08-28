# Guía de salida a producción

Estado: para usar tu propia waitlist funcionando mientras validás mercado. No todo es "lanzamiento público" todavía.

## Orden recomendado

Hacelo en este orden. Cada paso deja algo funcionando.

### Paso 1 — Deploy en Vercel (ya casi está)

Ya tenés el repo en Vercel (`waitlist-nine-pink.vercel.app`). Lo que falta es configurar las variables de entorno en **Vercel → Settings → Environment Variables**.

### Paso 2 — Variables de entorno

Copiá de `.env.local` a Vercel. **Ojo**: hay una inconsistencia que arreglar.

| Variable | Dónde obtenerla | Notas |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://tudominio.com` (sin barra final) | Usá el dominio real, no `vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | `https://tudominio.com` | **Falta en `.env.example`** — la usa testimonials (`/t/[slug]`). Agregala. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | **Secreto, nunca público** |
| `RESEND_API_KEY` | Resend → API Keys | |
| `PADDLE_WEBHOOK_SECRET` | Paddle → Developer Tools → Notifications | Ver Paso 6, crítico |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle → Checkout settings | |
| `PADDLE_PRICE_LAUNCH` | Paddle → Catálogo | ID del price (tipo **subscription**, no one-time) |
| `CRON_SECRET` | Generá uno con `openssl rand -hex 32` | Protege `/api/cron/dispatch-emails` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare → Turnstile | |
| `TURNSTILE_SECRET_KEY` | Cloudflare → Turnstile | Secreto |

**Arreglo obligatorio**: en `.env.example` agregá `NEXT_PUBLIC_SITE_URL=`. Y en el código, unificá para no depender de dos variables (idealmente todo debería usar `NEXT_PUBLIC_APP_URL`).

### Paso 3 — Supabase: alinear la base de datos

Tu BD cloud está parcheada a mano y desincronizada con las migraciones. Pegá este script idempotente en el **SQL Editor** (se puede re-ejecutar sin romper nada):

```sql
alter table public.subscribers
  add column if not exists email_status text,
  add column if not exists name text,
  add column if not exists country text;

create index if not exists idx_subscribers_email_status
  on public.subscribers(waitlist_id, email_status);

alter table public.showcases add column if not exists main_type text not null default 'image';
alter table public.showcases add column if not exists main_image text;
alter table public.showcases add column if not exists published_at timestamptz;
alter table public.showcases add column if not exists card_image text;

alter table public.showcases drop constraint if exists showcases_status_check;
alter table public.showcases add constraint showcases_status_check
  check (status in ('draft', 'published', 'rejected', 'coming_soon'));
```

Después creá las tablas de testimonials si todavía no existen (migración `011_testimonials.sql` completa, pegala entera).

### Paso 4 — Storage bucket público

Las imágenes del showcase y del page builder usan el bucket `showcase-images`. Tenés que hacerlo **público**:

- Supabase → Storage → crear bucket `showcase-images` (si no existe)
- Marcarlo como **Public**
- Verificar que la URL funcione: `https://tudominio.supabase.co/storage/v1/object/public/showcase-images/...`

### Paso 5 — Resend: dominio verificado y remitente

El dominio `leovenezia.dev` ya está verificado en Resend. El remitente se configura con la variable `EMAIL_FROM`:

```bash
EMAIL_FROM="LaunchList <hola@leovenezia.dev>"
```

Tenés que setearla en `.env.local` y en Vercel → Settings → Environment Variables. Sin `EMAIL_FROM`, `sendEmail` no envía nada. No hace falta registrar la parte antes del `@` (ej. `hola`) por separado: con el dominio verificado, cualquier dirección de ese dominio es válida.

### Paso 6 — Paddle webhook (crítico de seguridad)

Hoy `src/app/api/webhooks/paddle/route.ts` **no verifica la firma** del webhook. Lo dice el comentario en el código. Eso significa que cualquiera puede pegarle a tu endpoint y:
- Activar una suscripción gratis
- Cancelar la suscripción de otro usuario

Para producción tenés que:
1. Configurar `PADDLE_WEBHOOK_SECRET` en Vercel
2. Implementar la verificación ed25519 de la firma `paddle-signature` (o usar el SDK oficial de Paddle)
3. Configurar el webhook en Paddle para que apunte a `https://tudominio.com/api/webhooks/paddle`

**Si vas a cobrar suscripciones, esto es innegociable.** (FOLLOW-UP: ya está marcado con TODO en el código del webhook.)

### Paso 6.5 — pg_cron para jobs de expiración

Las migraciones `013_expire_showcases_job.sql` y `014_email_queue.sql` requieren:
- La extensión `pg_cron` habilitada en tu proyecto Supabase (Supabase Dashboard → Database → Extensions)
- La función `expire_due_showcases()` corre diariamente a las 03:00 UTC
- La función `enqueue_expiry_reminders()` corre diariamente a las 03:05 UTC y encola emails 30d/7d antes del vencimiento

**Si pg_cron no está disponible**, el job se puede correr desde Vercel Cron Jobs o cualquier scheduler externo que llame a una RPC expuesta.

El envío de los emails encolados se hace desde el endpoint `/api/cron/dispatch-emails` (protegido con `CRON_SECRET`). Configurá un Vercel Cron Job para llamarlo cada 5-10 minutos.

### Paso 7 — Cloudflare (dominio + país + captcha)

Cuando tengas dominio propio:
1. Agregá el dominio a Cloudflare
2. DNS: `CNAME` → `cname.vercel-dns.com` con nube **naranja** (proxied)
3. En Vercel, agregá el dominio (Settings → Domains)
4. El header `cf-ipcountry` empieza a llegar solo (ya lo usa el código para Country)

Turnstile: creá un widget en Cloudflare → Turnstile con tu dominio. Configurá `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`.

### Paso 8 — Revisión de seguridad antes de cobrar

- **Paddle webhook** (Paso 6) — obligatorio
- **`SUPABASE_SERVICE_ROLE_KEY`** solo en el server, nunca en `NEXT_PUBLIC_*`
- **RLS**: las tablas nuevas (testimonials) ya tienen políticas. Verificá que las de `subscribers` permitan lo necesario.
- **Rate limit** (`src/lib/api/rate-limit.ts`) es in-memory — en Vercel multi-instancia no funciona bien. Para el MVP alcanza, pero anotalo.
- **`verify-token.ts`** usa `SUPABASE_SERVICE_ROLE_KEY` como secret del token de verificación. Funciona, pero lo correcto es una variable propia (`VERIFY_TOKEN_SECRET`). Anotalo para endurecer después.

## Checklist mínimo para "funciona"

- [ ] Deploy en Vercel sin errores
- [ ] Variables de entorno todas seteadas (incluido `NEXT_PUBLIC_SITE_URL` y `CRON_SECRET`)
- [ ] Base de datos alineada — aplicar migraciones `012`, `013`, `014` además del Paso 3
- [ ] Bucket `showcase-images` público
- [ ] Resend con dominio verificado + `from` correcto
- [ ] Tu waitlist pública carga y recibe signups
- [ ] Emails de notificación llegan (probá con tu propio mail)
- [ ] pg_cron habilitado y jobs `expire-showcases-daily` + `enqueue-expiry-reminders-daily` programados
- [ ] Vercel Cron Job que llame a `/api/cron/dispatch-emails` cada 5-10 min

## Checklist para "cobrar plata"

- [ ] Paddle webhook con firma verificada
- [ ] Turnstile activo (anti-spam)
- [ ] Dominio propio con Cloudflare proxy
- [ ] Backup de Supabase (PITR si el plan lo permite)

## Lo que NO es urgente para validar mercado

- Migrar al CLI de Supabase (podés seguir con SQL manual)
- Rate limit distribuido (Redis/Upstash)
- Verificación de email con servicio pago (ZeroBounce, etc.)
- Geolocalización más precisa (Cloudflare `cf-ipcountry` alcanza)
