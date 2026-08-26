# S3A-2 · Wizard — personalizar sorpresa

|                |                                                                           |
| -------------- | ------------------------------------------------------------------------- |
| **Etapa**      | S3A-2 — Wizard sorpresa ([roadmap.md](../../roadmap.md) § S3A)            |
| **Owner**      | Equipo De Tin Marín                                                       |
| **App(s)**     | `apps/ecommerce`, `apps/admin`, `packages/shared`, `packages/validations` |
| **Schemas**    | `catalog`                                                                 |
| **Depende de** | [S3A-1/01-catalog-products-bundles.md](01-catalog-products-bundles.md)    |
| **Estado**     | draft                                                                     |

## Contexto (leer esto, no todo docs/)

- **Regla 7** — personalización desde plantilla; snapshot independiente del template.
- **Regla 8** — precio línea = Σ(`totalQuantity × unitPrice`) + `container.unitPrice × line.quantity` (cantidad de sorpresas editable).
- Admin `order-form` ya permite editar componentes y `quantity` al crear orden — **misma semántica** que ecommerce (admin sin tope 15–100).
- `storeFeatures.enableUnitsPerPerson = **true**` — UI del wizard permite
  editar unidades base **por sorpresa** (`quantityPerUnit` ≥ 1) por dulce;
  init desde `bundle_items.units_per_person`. Flag off fuerza 1.
- Stock: **solo warning** vía `checkOrderStock` (no bloquear agregar al wizard en v1).

## Objetivo

Desde una plantilla en `/sorpresas/[id]/personalizar`, el cliente agrega/quita/reemplaza dulces (mín./máx. **por plantilla**, defaults 8/20), elige la **cantidad de sorpresas** (15–100), ve precio en vivo y al finalizar obtiene una línea lista para el carrito (S3A-3).

## Reglas de personalización (cerradas)

| Regla                                | Valor                                                                                                                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mínimo productos                     | Por plantilla: `bundles.customization_min_products` (default **8**)                                                                                                           |
| Máximo productos                     | Por plantilla: `bundles.customization_max_products` (default **20**; techo **100**)                                                                                           |
| Catálogo de reemplazo                | **Cualquier producto activo** (mismo universo que admin)                                                                                                                      |
| Plantilla default                    | Items `bundle_items` precargados; usuario puede quitar cualquiera respetando mínimo                                                                                           |
| `quantity` (línea)                   | **Editable** en ecommerce: **15 ≤ quantity ≤ 100** sorpresas; init = `clamp(bundles.quantity, 15, 100)`. Admin: `>= 1` sin tope. `bundles.quantity` = sorpresas de plantilla. |
| `unitsPerPerson` / `quantityPerUnit` | Plantilla: `bundle_items.units_per_person` (≥ 1). Wizard: editable si `enableUnitsPerPerson`; `totalQuantity = quantityPerUnit × line.quantity`                               |
| Envase                               | De plantilla (`container_id`); congelado al agregar al carrito                                                                                                                |
| Stock UI                             | Warning si `checkOrderStock` falla para composición actual (no bloqueo)                                                                                                       |

## Scope IN

- Ruta `/sorpresas/[id]/personalizar` — wizard multi-paso o single-page (UX a criterio; lógica fija)
- Cargar plantilla: `getPublicBundle` + items + container
- Estado wizard: `components` + `quantity` alineados con `customizeBundleInputSchema`
- Panel “Agregar dulce”: buscador sobre catálogo activo (reutilizar listado S3A-1)
- Quitar / reemplazar con validación min/max
- Control de cantidad de sorpresas (15–100) con preview en vivo
- Preview precio en vivo: `buildOrderCart` / `buildShoppingCart` (1 línea bundle, `quantity` editable)
- Validación Zod estructural + bounds por plantilla (`validateBundleCustomization`) + bounds de cantidad
- Salida: `CartBundleLine` tipado (ver S3A-3) — “Agregar al carrito”
- i18n — wizard, límites, warnings stock
- Vitest — validación min/max por plantilla, cantidad 15–100, precio igual admin para misma composición
- Playwright — `apps/ecommerce/e2e/bundle-wizard-smoke.spec.ts`: abrir plantilla, quitar 1 dulce, agregar otro, ver total

## Scope OUT (traps)

- **NO** relajar 15–100 en ecommerce / guest checkout (admin order-form sí puede `quantity < 15`)
- **NO** olvidar: con flag off el wizard **fuerza** `quantityPerUnit = 1`
  (no confiar en el cliente)
- **NO bloqueo por stock** — solo banner warning
- **NO crear orden** — S3A-3
- **NO múltiples plantillas en un solo wizard** — 1 plantilla → 1 línea carrito con `quantity` N
- **NO `index.ts` barrels**

> **Nota cantidad:** `bundles.quantity` = cantidad de **sorpresas** de la plantilla (default). `line.quantity` en orden = sorpresas pedidas (puede cambiarse en el wizard). Init ecommerce = `clamp(bundles.quantity, 15, 100)`. El DTO wizard expone ese default como `personCount` (nombre legacy).

## Tablas y RLS

Migración posterior `00025_bundle_customization_limits.sql`:

- Añade `catalog.bundles.customization_min_products` y
  `customization_max_products` (`not null`, defaults 8/20).
- Hace backfill de las plantillas existentes.
- Garantiza en Postgres `min >= 1`, `max >= 1` y `min <= max`.
- El techo de 100 es defensa de aplicación/Zod, no restricción SQL.

Lectura pública catálogo existente; no cambia la superficie RLS.

## Boundaries y DTOs

| Boundary                      | Tipo          | Input                        | Output                                                                                    |
| ----------------------------- | ------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `getBundleForWizard`          | Server Action | `{ bundleId }`               | Plantilla + límites + items + container + `personCount` (= `bundles.quantity`, sorpresas) |
| `previewBundleLine`           | Server Action | `customizeBundleInputSchema` | `{ lineTotal, components, stockCheck }`                                                   |
| `validateBundleCustomization` | shared/Zod    | components[] + bounds        | ok / error codes                                                                          |

DTO plantilla (`bundleWizardTemplateSchema`): incluye `description`, `customizationMinProducts`, `customizationMaxProducts`, `personCount` (= cantidad de sorpresas de plantilla; nombre legacy).

`customizeBundleInputSchema`:

```typescript
{
  bundleId: string; // uuid plantilla
  quantity: number; // entero 15–100 (ecommerce)
  components: Array<{ productId: string; quantityPerUnit: number }>; // unique; min/max por bundle
}
```

## Rules que aplican

- Reglas **5–8, 7, 20**
- DECISIONS **#6, #17, #22**
- `storeFeatures.enableUnitsPerPerson`

## Orden de implementación

1. Schema Zod + tests min/max
2. Service preview (reutiliza shared order-cart + check-order-stock)
3. UI wizard + picker productos
4. Integración CTA desde S3A-1 detalle
5. Playwright + i18n
6. `pnpm check` + `pnpm build`

## Criterios de aceptación

- [x] El wizard y el preview rechazan una composición fuera del rango de su
      plantilla (no un 5/20 global)
- [ ] No se puede guardar con productos duplicados
- [ ] Precio preview = admin order-form para misma composición (± S/ 0.01)
- [x] Quitar item default y agregar otro del catálogo respeta mínimo/máximo
      configurados
- [ ] Warning stock visible cuando `checkOrderStock` falla; wizard sigue permitiendo continuar
- [x] `enableUnitsPerPerson=true` → stepper de unidades por sorpresa por dulce
      (mín. 1; init desde plantilla)
- [x] `enableUnitsPerPerson=false` → sin input; `quantityPerUnit` forzado a 1
- [ ] Descripción de plantilla visible en wizard cuando `description` no es null
- [ ] Vitest — `customize-bundle.test.ts`
- [ ] Playwright — wizard smoke verde
- [ ] `pnpm check` + `pnpm build` verdes

## Preguntas abiertas

- Ninguna — los límites son configurables por plantilla (defaults 8/20,
  techo 100). Unidades por sorpresa: flag `enableUnitsPerPerson` (**true**
  en storefront; DECISIONS #22).

## Depends on

- [01-catalog-products-bundles.md](01-catalog-products-bundles.md)
- [business-rules.md](../../business-rules.md) Regla 7

## Bloquea

- S3A-3 (líneas bundle personalizadas en carrito)
