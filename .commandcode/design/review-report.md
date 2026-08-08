# Showcase Design — Review Report

**Date:** 2026-08-03

---

## First Impression: 4/10

La página aterriza como un template. Hero centrado con "Showcase", una línea de texto genérico, filtros, grilla de cards — el arquetipo más seguro de cualquier directorio. En dos segundos no sé qué clase de producto es esto, qué tono tiene, ni por qué debería confiar en lo que veo. El color es el que vino con shadcn. No hay un solo elemento visual que no pueda mover a otro producto cambiando el texto.

## Hierarchy: 3/10

La grilla de cards es plana: toda card tiene la misma imagen 16:9, el mismo tamaño de título truncado, la misma descripción a 2 líneas, las mismas pills de categoría. No hay diferenciación visual entre un producto "featured", uno "published" y uno en construcción — salvo badges minúsculos. En la página de detalle, el contenido cae en bloques visualmente idénticos uno tras otro: título → categorías → descripción → gallery → do-follow → testimonials. El badge "In construction" tiene el mismo peso que una categoría. Nada guía la mirada.

## Color Voice: 3/10

Paleta 100% shadcn/ui default. El badge "In construction" usa `secondary`, que es un gris apenas distinto. El hover de las cards va a `primary/40`, pero `primary` es lo que shadcn generó por default. No hay un color que asocie con este producto. El showcase es un directorio de productos construidos por makers — merece un color que hable de construcción, progreso, energía, no de un dashboard administrativo.

## Type Voice: 3/10

Una sola fuente, sin contraste tipográfico. Las cards comprimen todo: título `text-sm`, descripción `text-xs`, categorías `text-[10px]`. En detalle, la descripción larga es un bloque gris sin ritmo editorial. No hay pull quotes, no hay leading ajustado por contexto, no hay jerarquía de lectura. El formulario del dashboard es un muro de inputs con labels genéricos.

## Interaction Feel: 4/10

Lo que funciona: el skeleton loading en la búsqueda, los badges "New"/"Removed" en la galería, la barra de status con "View live". Lo que falta: no hay transiciones entre secciones en el detalle, los botones de filtro son `<button>` sin focus rings visibles, los checkboxes del form no tienen label clickeable, no hay indicador visual de qué cambió después de un Update. Los estados de error fuera del form no están diseñados.

---

## Heuristic Scores

| # | Heuristic | Score | Key Finding |
|---|---|---|---|
| 1 | First Impression | 4/10 | Generic directory template. No visual identity. |
| 2 | Hierarchy | 3/10 | Flat card grid. Detail page is undifferentiated vertical blocks. |
| 3 | Color Voice | 3/10 | Default shadcn palette. No brand color signal. |
| 4 | Type Voice | 3/10 | Single font, compressed at tiny sizes, no editorial rhythm. |
| 5 | Interaction | 4/10 | Skeleton loading ok. Missing focus rings, transitions, change indicators. |
| **Total** | **17/50** | |

---

## AI Smells Detected

- **Card grid + centered hero + pills** — el layout más genérico de cualquier SaaS directory
- **"Discover X built by Y"** — copy que calza en cualquier producto
- **Testimonials "coming soon" placeholder** — el placeholder más común del internet
- **Paleta shadcn sin override** — no hay decisión de color, solo defaults heredados
- **Rounded-full bg-muted pills** — el pattern más seguro, usado en todos lados
- **Sin elemento visual distintivo** — si cambio el texto, esto podría ser cualquier directorio

---

## What's Working

- **Gestión de galería diferida** con badges "New"/"Removed" — el mejor momento de UX en todo el producto
- **Botón dual de publicación** (Full launch / In construction) — decisión clara para el maker
- **Skeleton loading** en búsqueda del directorio con transiciones de ruteo
- **Barra de status** con link "View live" — útil y bien posicionada
- **Flujo de datos y ruteo** limpio — no hay bugs estructurales visibles

---

## Priority Issues

### P0 — Sin identidad visual

El showcase no tiene voz. Es un directorio genérico. Necesita un color que hable de construcción, progreso, energía maker. Necesita un elemento visual ancla en la primera pantalla que no sea un heading centrado. Necesita que el status "building" se vea diferente de "published" — no solo un badge, sino un tratamiento visual completo que genere anticipación.

**Fix:** `/design recolor` + `/design relayout` — elegir un color con personalidad (ámbar/quemado para building, algo más pulido para published), darle al hero del directorio un statement visual, y diferenciar la card de building con tratamiento distinto (borde trabajado, indicador de progreso, algo que diga "esto se está cocinando").

### P0 — Página de detalle es un scroll vertical sin ritmo

Los bloques (descripción, gallery, do-follow, testimonials) son visualmente idénticos — mismo padding, mismo borde, mismo fondo. El usuario lee sin saber qué es importante.

**Fix:** `/design relayout` — dos columnas en desktop: contenido principal a la izquierda (descripción + gallery), sidebar a la derecha (do-follow link, waitlist, badges). Para building: la waitlist debe ser el foco, no un bloque más abajo. Usar un layout asimétrico que jerarquice.

### P1 — Las cards del directorio son todas iguales

Mismo tamaño, misma estructura, mismo peso visual. Un producto "featured" debería romper el grid. Un producto "building" debería verse distinto — no solo un badge de 10px.

**Fix:** `/design relayout` — featured card ocupa 2 columnas. Building cards tienen un skeleton/sash que indica progreso, o un contenedor distinto (borde dashed, overlay sutil). Publicadas tienen el tratamiento actual pero con mejor tipo.

### P1 — Tipografía comprimida y sin escala

Las cards usan `text-sm` para títulos y `text-[10px]` para categorías. En mobile 320px esto puede ser ilegible. No hay contraste de peso entre título y descripción.

**Fix:** `/design typeset` — establecer una escala con pasos visibles: título card a `text-base`, descripción a `text-sm`, categorías a `text-xs`. En el detalle, la descripción larga necesita `text-base leading-relaxed` no `text-muted-foreground` opaco.

### P2 — Sin focus rings ni indicadores de cambio

Los filtros del directorio son `<button>` sin `:focus-visible`. Después de un Update, no hay feedback visual de "cambios guardados". El checkbox de "featured" no es clickeable via label.

**Fix:** `/design interaction` — focus rings en filtros, toast/toast-success después de Update, label htmlFor clickeable en featured, transiciones suaves al cambiar de estado.

---

## Cognitive Load / Risk

- **PASS** — Flujo de ruteo y navegación limpio. No se pierde el contexto.
- **PASS** — Gestión diferida de imágenes bien comunicada.
- **WATCH** — La diferencia entre "Full launch" e "In construction" se explica solo en un tooltip de texto chico. Riesgo de confusión para nuevos usuarios.
- **WATCH** — El formulario asume que el usuario sabe qué es un slug, qué categoría elegir, y para qué sirve la imagen principal. No hay micro-copy de ayuda.
- **FAIL** — Sin identidad visual. El producto no se recuerda.

## Next Modes

`/design recolor` `/design relayout` `/design typeset` `/design interaction`
