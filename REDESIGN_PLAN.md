# Redesign Plan — Waitlist by [PACK]

Este plan divide el rediseño del frontend en tareas pequeñas, independientes y ordenadas por dependencia. Combina el `audit` de impeccable (calidad técnica, UX, a11y, responsive) con la lente de ponytail (eliminar sobreingeniería, simplificar, YAGNI). Cada tarea describe **qué hacer**, **por qué** y **cómo verificarlo**.

**Modo**: Operate — el dashboard es una herramienta, no una galería. Scanability, consistencia y velocidad sobre expresión.

**Principio rector**: El frontend actual es funcional pero tiene una sobrecapa de abstracciones (shadcn/ui + @base-ui/react) que agregan ~1500 líneas de wrappers y dependencias para reemplazar tags HTML con lógica cero. ~80% de los componentes UI pueden ser HTML nativo con clases Tailwind. El rediseño elimina esa capa y reconstruye con lo mínimo necesario.

---

## Fase 0 — Foundation (sin dependencias externas)

### 0.1 Design Tokens + Global CSS

**Qué**: Reescribir `globals.css` y eliminar dependencias de shadcn/tailwind.css y tw-animate-css. Mantener el tema oklch monocromático actual pero recortar variables no usadas (chart-1 a 5 solo tiene 2 usos, sidebar-ring y sidebar-border solo existen por shadcn).

**Por qué**: `@import "shadcn/tailwind.css"` trae cientos de variables que no se usan. `tw-animate-css` no se usa en ningún componente real. Limpiar esto achica el CSS compilado y elimina dependencias.

**Qué eliminar**:
- `@import "shadcn/tailwind.css"` — reemplazar solo las variables que realmente se referencian
- `@import "tw-animate-css"` — transiciones CSS nativas cubren lo que hay
- Variables de color que Tailwind activa pero la app no usa: chart-1..5, sidebar-ring, sidebar-border, sidebar-accent, sidebar-accent-foreground
- `--font-heading` que es idéntica a `--font-sans`
- Escala de radius progresiva si solo se usa `rounded-lg` y `rounded-xl`

**Verificar**: `pnpm dev` arranca sin errores CSS. El dashboard se ve igual visualmente.

**Archivos**: `src/app/globals.css`

---

### 0.2 Eliminar layouts fantasma

**Qué**: Eliminar `(auth)/layout.tsx` y `(marketing)/layout.tsx`. Los route groups se mantienen (organizan archivos) pero los layouts no hacen nada.

**Por qué**: 2 archivos, 8 líneas cada uno, cero lógica. Los layouts "pasabolsa" son código muerto.

**Verificar**: Las rutas /login, /signup, /pricing funcionan igual.

**Archivos**: `src/app/(auth)/layout.tsx`, `src/app/(marketing)/layout.tsx`

---

### 0.3 Eliminar dependencias no usadas o reemplazables

**Qué**: De `package.json`:
- Mover `shadcn` de `dependencies` a `devDependencies` (es CLI, no runtime)
- Eliminar `zod` si no se usa en frontend (confirmar)
- Eliminar `tw-animate-css` si se confirma que no hay animaciones que lo requieran

**Por qué**: Dependencias que no se usan en runtime inflan el bundle mental y físico.

**Verificar**: `pnpm build` pasa sin errores de imports faltantes.

**Archivos**: `package.json`

---

## Fase 1 — Core UI (depende de Fase 0)

### 1.1 Reemplazar shadcn/ui wrappers con HTML nativo

**Qué**: Convertir los 11 componentes de `src/components/ui/` a HTML nativo con clases Tailwind. Los wrappers actuales (Button, Input, Card, Badge, Table, Label, Avatar, Skeleton, Separator, DropdownMenu, Switch) envuelven tags HTML sin agregar lógica — son puro markup con className.

**Estrategia**:
- **Button** (`button.tsx`): Reemplazar `@base-ui/react/button` + `class-variance-authority` por `<button className="...">`. Mantener las variantes (default, outline, ghost, destructive, link) pero inline en cada uso o como objeto compartido en el mismo archivo. Eliminar tamaños icon-xs, icon-sm, icon-lg que no se usan.
- **Input** (`input.tsx`): Reemplazar `@base-ui/react/input` por `<input className="...">`.
- **Label** (`label.tsx`): Reemplazar por `<label className="...">`.
- **Card** (`card.tsx`): Reemplazar 6 subcomponentes (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction) por `<div className="...">`. CardAction no se usa nunca. Eliminarlo.
- **Badge** (`badge.tsx`): Reemplazar por `<span className="...">`.
- **Table** (`table.tsx`): Reemplazar 8 subcomponentes por `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` nativos con clases.
- **Avatar** (`avatar.tsx`): Mantener solo Avatar + AvatarFallback. Eliminar AvatarImage, AvatarBadge, AvatarGroup, AvatarGroupCount (no se usan).
- **Switch** (`switch.tsx`): Es el único componente no-trivial. Evaluar si se reemplaza por checkbox estilizado con CSS o se mantiene wrapper mínimo sobre `@base-ui/react/switch`.
- **Separator** (`separator.tsx`): Eliminar. No se usa (user-nav usa `<hr />`).
- **Skeleton** (`skeleton.tsx`): Eliminar o reemplazar por `<div className="animate-pulse bg-muted rounded ...">`.
- **DropdownMenu** (`dropdown-menu.tsx`): Eliminar. No se usa en ningún lado (user-nav implementa su propio dropdown manual).

**Impacto**: ~900 líneas eliminadas, 0 dependencias de UI runtime.

**Verificar**: Cada página del dashboard se renderiza correctamente sin errores de import. Los tests visuales no muestran regresión.

**Archivos**: `src/components/ui/*.tsx`, `src/lib/utils.ts` (posiblemente simplificar cn())

---

### 1.2 Reemplazar CVA + buttonVariants

**Qué**: La función `cva` de `class-variance-authority` solo se usa para `button.tsx` y `badge.tsx`. Reemplazar las variantes con un objeto plano o función inline que devuelva la clase CSS.

**Por qué**: `class-variance-authority` es una dependencia para generar strings de clase condicionales. Se puede reemplazar con `cn()` + ternarios.

**Verificar**: Todos los botones y badges mantienen sus variantes visuales.

**Archivos**: `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`, `package.json`

---

## Fase 2 — Dashboard Shell (depende de Fase 1)

### 2.1 Simplificar Sidebar

**Qué**: Reemplazar `products` (array de 1 elemento en `src/lib/products.ts`) por un Link hardcodeado en `sidebar.tsx`.

**Por qué**: Una abstracción (`products.ts`) con un solo producto es over-engineering. El sidebar siempre va a linkear a /dashboard. Si en el futuro hay más productos, se agrega una lista, no una abstracción anticipada.

**Verificar**: El sidebar se ve y funciona igual.

**Archivos**: `src/components/dashboard/sidebar.tsx`, eliminar `src/lib/products.ts`

---

### 2.2 Simplificar UserNav

**Qué**: UserNav ya está bien (HTML puro sin base-ui, buen uso de refs y eventos). Solo limpiar:
- Reemplazar `import { Avatar, AvatarFallback } from "@/components/ui/avatar"` por `<div className="...">` con las iniciales inline

**Por qué**: Avatar se usa solo acá y en ningún otro lado. No necesita un componente.

**Verificar**: El menú de usuario se abre/cierra, muestra iniciales, links funcionan.

**Archivos**: `src/components/dashboard/user-nav.tsx`

---

### 2.3 Responsive: mobile sidebar

**Qué**: El sidebar es fijo (w-16) y no tiene variante mobile. Agregar un menú hamburguesa en mobile que muestre/oculte el sidebar como overlay. Mantener el sidebar actual en desktop.

**Por qué**: La app no es usable en mobile desde el dashboard. Para un MVP puede esperar, pero es una deuda técnica visible.

**Prioridad**: Baja (post-MVP). Se puede marcar como `ponytail:` en sidebar.

**Archivos**: `src/components/dashboard/sidebar.tsx`, `src/app/dashboard/layout.tsx`

---

## Fase 3 — Pages (depende de Fase 1, Fase 2)

### 3.1 Unificar definición de planes

**Qué**: Actualmente los planes están definidos en **3 lugares**: `pricing/page.tsx`, `upgrade-content.tsx` y `plan-gates.ts`. Crear un archivo `src/lib/plans.ts` con la fuente única de verdad.

**Por qué**: Si cambia un precio o feature, hay que acordarse de actualizar 3 archivos. Esto ya causó confusión entre pricing y upgrade.

**Modelo de datos sugerido**:
```ts
export interface Plan {
  id: string;
  name: string;
  price: string;
  priceId?: string;
  description: string;
  limit: string;
  limitNumber: number | null;
  popular?: boolean;
  features: string[];
  cta: string;
  href: string;
}
```

**Verificar**: Pricing, upgrade y plan-gates usan el mismo array. Cambiar un precio en un solo lugar se refleja en todos.

**Archivos**: `src/lib/plans.ts` (nuevo), `src/app/(marketing)/pricing/page.tsx`, `src/app/dashboard/waitlists/[id]/upgrade/upgrade-content.tsx`, `src/lib/plan-gates.ts`

---

### 3.2 Upgrade page: eliminar polling de Paddle

**Qué**: Reemplazar `setInterval` que chequea `window.Paddle` cada 200ms por el callback `onLoad` de `next/script`. Paddle.js se carga vía `Script` en el dashboard layout con `strategy="afterInteractive"`. El componente `PaddleInit` y la detección en `UpgradeContent` son duplicados.

**Cómo**: Unificar la inicialización en `PaddleInit` (que ya se renderiza en el layout) y que `UpgradeContent` espere por un estado React simple en vez de hacer polling.

**Por qué**: Polling es un antipatrón. El layout ya carga Paddle con `next/script`. No hay razón para que UpgradeContent lo vuelva a detectar.

**Verificar**: El botón de comprar se habilita cuando Paddle está listo, sin delay artificial.

**Archivos**: `src/components/shared/paddle-init.tsx`, `src/app/dashboard/waitlists/[id]/upgrade/upgrade-content.tsx`

---

### 3.3 Subscribers table: paginación server-side ✅

**Estado**: Resuelto. La paginación server-side ya estaba implementada (`.range()` + `count: "exact"` con página/filtros como search params, introducido en el renombre de tablas). En esta revisión se corrigieron los bugs residuales:

- **Export sin auth** (`api/projects/[id]/export`): cualquiera podía descargar todos los suscriptores conociendo el project id. Ahora verifica ownership con lectura RLS (`createClient()`) antes del admin client.
- **Validate sin auth** (`api/projects/subscribers/validate`): POST anónimo mutaba `email_status` de cualquier suscriptor. Mismo fix: lectura RLS previa.
- **Debounce del buscador**: los timers no se limpiaban entre teclas (navegaciones encadenadas). Ahora usa ref con cleanup.
- **`?page=` sin sanitizar**: `page=abc` producía `NaN` en `.range()`, `page=999` mostraba rango inválido. Ahora se parsea como entero y las páginas fuera de rango redirigen a la primera conservando filtros.

**Archivos**: `src/app/dashboard/projects/[id]/subscribers/page.tsx`, `subscribers-table.tsx`, `src/app/api/projects/[id]/export/route.ts`, `src/app/api/projects/subscribers/validate/route.ts`

---

### 3.4 Settings form: Server Action unificada

**Qué**: El formulario de settings envía campos anidados con dots en el name (`branding.primary_color`) y la server action reconstruye el objeto JSON manualmente. Esto es frágil: si se agrega un campo y se olvida la action, el setting no se persiste sin error visible.

**Simplificación**: Cambiar el form para que los campos de settings anidados se serialicen como JSON en un campo oculto, o que la server action itere sobre las keys del formData en vez de mapear cada una individualmente.

**Por qué**: Reduce el acoplamiento entre form y action. Menos código, menos bugs.

**Archivos**: `src/app/dashboard/waitlists/[id]/settings/settings-form.tsx`, `src/app/dashboard/waitlists/[id]/settings/actions.ts`

---

### 3.5 Public waitlist form: usar Server Action

**Qué**: `public-waitlist-form.tsx` hace `fetch()` directo a la API route `/api/public/subscribe` con manejo manual de estado (loading, error, result, turnstileToken). Migrar a `useActionState` como los otros forms.

**Por qué**: El patrón `useActionState` es más declarativo, menos boilerplate (no hay useState para loading/error/result), y evita tener que definir una API route separada si se puede llamar directo a la server action.

**Consideración**: La API route también es consumida por el widget JS (`widget.js`). Si se migra a Server Action, mantener la API route para el widget. El form público puede usar Server Action, la API route queda para third parties.

**Verificar**: El form público funciona sin errores, con estados de carga y error correctos.

**Archivos**: `src/app/p/[slug]/public-waitlist-form.tsx`

---

### 3.6 Duplicación de Google SVG

**Qué**: El SVG del logo de Google aparece idéntico en `login-form.tsx` y `signup-form.tsx`. Extraer a un componente compartido `<GoogleIcon />`.

**Por qué**: DRY. Son ~20 líneas de SVG repetidas.

**Verificar**: Ambos forms muestran el botón de Google idéntico.

**Archivos**: `src/app/(auth)/login/login-form.tsx`, `src/app/(auth)/signup/signup-form.tsx`

---

## Fase 4 — API & Lib (depende de nada, se puede hacer en paralelo)

### 4.1 Simplificar paddle.ts

**Qué**: `paddle.ts` tiene 62 líneas para 6 funciones que mayormente leen `process.env` con side effects al importar (`registerPriceMapping`). Reemplazar por lectura directa de `process.env` donde se necesita.

**Por qué**: Wrappers de `process.env` son abstracción sin propósito. El side effect al importar es un antipatrón (el orden de import puede cambiar el comportamiento).

**Verificar**: El webhook de Paddle funciona sin errores.

**Archivos**: `src/lib/paddle.ts`

---

### 4.2 Simplificar plan-gates.ts

**Qué**: Reemplazar `plan-gates.ts` por una referencia a `src/lib/plans.ts` (creado en 3.1). `hasFeature(plan, feature)` puede ser una función de 5 líneas que busca el feature en el array del plan.

**Por qué**: Evitar duplicación de la definición de planes. plan-gates actualmente tiene sus propios arrays de features separados.

**Verificar**: `feature-gate.tsx` y la API route de subscribe siguen funcionando.

**Archivos**: `src/lib/plan-gates.ts`

---

### 4.3 Rate limiter: marcar como ponyfail

**Qué**: El rate limiter en memoria (`rate-limit.ts`) no funciona en serverless (cada instancia tiene su propio Map). Agregar un comentario `ponytail:` que indique el techo: funcional para desarrollo, no funciona en producción multi-instancia. Migrar a Upstash Redis cuando sea necesario.

**Por qué**: El rate limiter actual da una falsa sensación de seguridad. Es mejor documentar su limitación que pretender que funciona.

**Archivos**: `src/lib/api/rate-limit.ts`

---

### 4.4 Limpiar hook use-user.ts

**Qué**: Eliminar `src/hooks/use-user.ts`. No se importa en ningún componente. El user se obtiene consistentemente desde server components.

**Por qué**: Código muerto.

**Archivos**: Eliminar `src/hooks/use-user.ts`

---

## Fase 5 — UX & Visual (depende de Fase 1)

### 5.1 Estados vacíos y onboarding

**Qué**: Actualmente cuando no hay waitlists, el dashboard muestra un texto genérico. Agregar estados vacíos con ilustración simple y CTA claro para crear la primera waitlist. También para subscribers=0, analytics sin datos, etc.

**Por qué**: Los estados vacíos son la primera impresión del producto. Actualmente hay cero diseño en empty states.

**Verificar**: Cada página del dashboard muestra un estado vacío digno cuando no hay datos.

**Archivos**: `src/app/dashboard/page.tsx`, `src/app/dashboard/waitlists/[id]/subscribers/page.tsx`, `src/app/dashboard/waitlists/[id]/analytics/page.tsx`, etc.

---

### 5.2 Consistencia tipográfica y espaciado

**Qué**: Asegurar que todos los títulos de página usen `text-2xl font-semibold` (ya es el estándar), el espaciado entre secciones sea `space-y-6` (ya es el estándar) y no haya outliers. Revisar:
- Login/signup: el título es `text-2xl font-semibold tracking-tight` — el `tracking-tight` es inconsistente con el resto
- Pricing: `text-3xl font-bold tracking-tight sm:text-4xl` — diferente a la convención del dashboard

**Por qué**: La consistencia visual es lo que hace que un producto se sienta profesional. Micro-inconsistencias se notan.

**Archivos**: Revisión de todas las pages.

---

### 5.3 Feedback visual en formularios

**Qué**: Agregar indicadores de carga inline en formularios (spinners pequeños en botones durante submit, no solo texto "Saving..."). Mejorar mensajes de error: field-level en vez de solo un banner genérico.

**Por qué**: UX actual es funcional pero básica. Los spinners inline ya se usan en login/signup (texto "Signing in..."), se puede mejorar con un spinner SVG de 4 líneas y animación CSS.

**Archivos**: `src/app/dashboard/waitlists/[id]/settings/settings-form.tsx`, `src/app/dashboard/waitlists/new/create-waitlist-form.tsx`

---

### 5.4 Responsive landing page

**Qué**: La landing page actual usa `sm:grid-cols-3` para las features y un header con `container mx-auto`. Verificar que se vea bien en mobile (actualmente un columna apilada con padding adecuado probablemente funciona, pero hay que confirmar).

**Por qué**: La landing es la cara del producto. Si se rompe en mobile, pierde conversiones.

**Archivos**: `src/app/page.tsx`

---

## Orden de ejecución recomendado

```
Fase 0 ─┬─ 0.1 Design Tokens
         ├─ 0.2 Layouts fantasma
         └─ 0.3 Dependencias muertas
             │
Fase 1 ──┴─ 1.1 UI wrappers → HTML nativo
         └─ 1.2 CVA → objeto plano
             │
Fase 2 ──┬─ 2.1 Sidebar (eliminar products.ts)
         ├─ 2.2 UserNav (Avatar inline)
         └─ 2.3 Responsive sidebar (baja prioridad)
             │
Fase 3 ──┬─ 3.1 Unificar planes (depende de Fase 1)
         ├─ 3.2 Upgrade: eliminar polling
         ├─ 3.3 Subscribers: paginación server-side (bug)
         ├─ 3.4 Settings: action unificada
         ├─ 3.5 Public form: Server Action
         └─ 3.6 Google SVG compartido
             │
Fase 4 ──┬─ 4.1 Simplificar paddle.ts (paralelo)
         ├─ 4.2 Simplificar plan-gates.ts (paralelo)
         ├─ 4.3 Rate limiter: ponytail comment
         └─ 4.4 Eliminar use-user.ts hook
             │
Fase 5 ──┬─ 5.1 Estados vacíos
         ├─ 5.2 Consistencia visual
         ├─ 5.3 Feedback en formularios
         └─ 5.4 Responsive landing
```

Cada fase es independiente y se puede hacer sin completar la anterior (excepto Fase 1 que requiere Fase 0, y Fase 3 pide Fase 1).

---

## Resumen de impacto estimado

| Métrica | Antes | Después |
|---|---|---|
| Componentes UI | 11 archivos | ~4 archivos (Button, Input, Card, Switch simplificados) |
| Dependencias runtime UI | @base-ui/react, class-variance-authority, lucide-react, tw-animate-css | 0 dependencias de UI |
| Líneas en components/ui/ | ~650 | ~200 |
| Archivos eliminados | — | ~6 (layouts fantasma, dropdown-menu, products, use-user, paddle.ts quizás) |
| Código muerto limpiado | ~10 archivos/componentes no usados | 0 archivos no usados |
| Bundle size | Base UI ~50kb gzip? | Solo Tailwind + SVG inline |

## Notas de ponytail

Marca con `ponytail:` los tech-debt conscientes:
- **Paginación server-side**: el límite de 50 + paginación cliente funciona para waitlists chicas. `ponytail: server-side pagination when waitlists exceed 500 subscribers`
- **Rate limiter en memoria**: `ponytail: swap to Upstash Redis when deploying multi-instance`
- **Mobile sidebar**: `ponytail: add hamburger menu when mobile usage justifies it`
- **Resend API key**: `ponytail: replace with real key when email sending is tested`
