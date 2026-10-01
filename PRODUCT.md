# Startpack — producto y estado actual

## Propuesta

Startpack ayuda a founders a presentar y lanzar productos. El directorio público es la superficie central; cada proyecto combina una ficha/showcase con una waitlist y herramientas para construir su landing y gestionar testimonials.

## Usuarios y unidad de producto

- Founders e indie hackers que quieren presentar un producto, captar una audiencia previa al lanzamiento y reunir prueba social.
- Cada proyecto es una unidad independiente con showcase, waitlist, configuración/landing y gestión de testimonials.
- El producto prioriza discoverability del directorio (SEO/GEO/visibilidad); testimonials complementan la ficha de productos lanzados, no reemplazan el directorio como propuesta central.

## Planes en código

Planes mensuales por proyecto, definidos en `src/lib/plans.ts`:

| Plan | Precio | Showcase | Waitlist | Diferencias principales |
|---|---:|---|---:|---|
| Free | $0 | Expira al año | 100 | Builder básico, widget y export; branding Startpack en widgets |
| Launch | $9/mes | Sin expiración | 1.000 | Acceso a templates, double opt-in y Slack notifications |
| Grow | $29/mes | Sin expiración | 10.000 | Team/webhooks/Zapier/custom domain, remove branding y otras funciones de `FEATURE_MATRIX` |

Precios, límites y gating pueden cambiar en el código/configuración de Paddle. `src/lib/plans.ts` es la fuente de verdad de plan/features en esta versión; verificar env vars y catálogo Paddle por separado.

## Flujos de producto

1. Crear proyecto y completar el showcase.
2. Publicarlo en el directorio como lanzado o Coming soon.
3. Configurar waitlist y compartir `/p/[slug]` o el widget.
4. Captar signups y referrals; revisar subscribers/analytics/export.
5. Recopilar testimonials mediante un form público, moderarlos y reutilizar los que tengan permiso público.
6. Mantener el producto listado después del lanzamiento; el acceso/expiración depende del plan.

## Superficies actuales

### Showcase / directorio

- `/` es el directorio; `/products`, `/launches`, `/coming-soon` son superficies de listado.
- `/product/[slug]` es la ficha pública. Coming soon enlaza con la waitlist; no muestra testimonials porque el producto todavía no se lanzó.
- El editor de showcase permite media principal (imagen/video según el campo), imágenes para cards y publicación; requisitos concretos varían por status.

### Waitlist

- `/p/[slug]`: hosted page con builder de secciones o template.
- `/w/e/[publicKey]`: embed en iframe, cargado por `public/widget.js`; también hay embed de leaderboard.
- `/api/public/subscribe`: registra suscriptor, referral, posición, notificaciones y respuestas post-signup según configuración.
- Analytics cuenta eventos atribuibles a hosted pages; embeds/API quedan fuera. Los eventos anteriores a la atribución por source se identifican como legacy y no se mezclan con métricas hosted.

### Page Builder y Thank You

- Builder: hero, features, how it works, FAQ, waitlist form y media + text; templates disponibles según plan.
- Un template activo define la identidad/layout de la landing y su confirmación post-signup. La sección Thank You edita el copy/configuración clásica, que no reemplaza la salida propia del template.
- Hay configuraciones históricas sin consumidor; no se presentan como funcionalidad activa en la UI. Revisar render real antes de documentar nuevos controles como entregados.

### Testimonials

- Forms públicos en `/t/[formSlug]` y `/t/[formSlug]/embed`, con wizard que deriva pasos de campos/preguntas habilitados; incluye rating/mensaje, preguntas custom, feedback privado, consentimiento, datos de autor/empresa, review y thank-you.
- Uploads de foto/logo usan ruta server-side de signed URL y procesado en cliente para limitar peso.
- Moderación manual (`pending` → approve/reject) o auto según form; detalle dashboard muestra contacto, respuestas, feedback privado, origen/formulario, permiso y deja editar texto/nombre/cargo/empresa.
- El formulario puede archivarse y la ruta muestra estado cerrado; el API solo acepta forms publicados.
- Solo se publica un testimonial `approved` con `consent='public'`. `private` y `null` quedan fuera de toda salida pública. Los registros legacy con consentimiento nulo requieren confirmación explícita del dueño de que ya obtuvo permiso; queda guardado quién/cuándo. No se puede cambiar un `private` explícito con ese mecanismo.
- Salidas actuales: ficha de producto lanzado (`/product/[slug]`) y widget embebible de testimonials (`/w/t/[publicKey]`, se instala desde Integration). No se muestran en Coming soon ni en `/p`.
- El SELECT anónimo directo a `testimonials` se retira con migración 020; ficha/widget consultan en servidor una allowlist de campos. Las migraciones 020–022 existen en el repo, pero hay que confirmar si ya se aplicaron en la DB cloud.

## Límites y roadmap conocido

No se considera implementado todavía: import/export de testimonials, filtros avanzados/búsqueda/tags, moderación por lote, métricas por paso/abandono, notificación al dueño al recibir testimonial y preview/deduplicación completa de invitaciones. Ver `CHANGELOG.md` para el historial; confirmar el estado en código antes de retomar cada punto.

## Documentos relacionados

- Estado técnico y mapa para nuevas sesiones: `.commandcode/contexto-proyecto.md`
- Sistema visual: `DESIGN.md`
- Deploy/operaciones: `PRODUCTION.md`
- Estado y pendientes de pagos: `PADDLE.md`
- Historial: `CHANGELOG.md`
