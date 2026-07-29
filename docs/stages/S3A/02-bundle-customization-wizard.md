# S3A-2 · Wizard — personalizar sorpresa

|                |                                                                        |
| -------------- | ---------------------------------------------------------------------- |
| **Etapa**      | S3A-2 — Wizard sorpresa ([roadmap.md](../../roadmap.md) § S3A)         |
| **Owner**      | Equipo De Tin Marín                                                    |
| **App(s)**     | `apps/ecommerce`, `packages/shared`, `packages/validations`            |
| **Schemas**    | `catalog`                                                              |
| **Depende de** | [S3A-1/01-catalog-products-bundles.md](01-catalog-products-bundles.md) |
| **Estado**     | draft                                                                  |

## Contexto (leer esto, no todo docs/)

- **Regla 7** — personalización desde plantilla; snapshot independiente del template.
- **Regla 8** — precio línea = Σ(`totalQuantity × unitPrice`) + `container.unitPrice × bundle.quantity` (personas fijas de plantilla).
- Admin `order-form` ya permite editar componentes de bundle al crear orden — **misma semántica** que ecommerce.
- `storeFeatures.enableUnitsPerPerson = false` — UI oculta/deshabilita cantidad por dulce; código soporta `unitsPerPerson` cuando flag = true.
- Stock: **solo warning** vía `checkOrderStock` (no bloquear agregar al wizard en v1).

## Objetivo

Desde una plantilla en `/sorpresas/[id]/personalizar`, el cliente agrega/quita/reemplaza dulces (mín. 5, máx. 20 por sorpresa), ve precio en vivo y total de personas fijo de la plantilla; al finalizar obtiene una línea lista para el carrito (S3A-3).

## Reglas de personalización (cerradas)

| Regla                 | Valor                                                                               |
| --------------------- | ----------------------------------------------------------------------------------- |
| Mínimo productos      | **5** por sorpresa                                                                  |
| Máximo productos      | **20** por sorpresa                                                                 |
| Catálogo de reemplazo | **Cualquier producto activo** (mismo universo que admin)                            |
| Plantilla default     | Items `bundle_items` precargados; usuario puede quitar cualquiera respetando mínimo |
| `quantity` (personas) | **No editable** — viene de `bundles.quantity` de plantilla                          |
| `unitsPerPerson`      | **1** en v1; UI condicionada por `enableUnitsPerPerson`                             |
| Envase                | De plantilla (`container_id`); congelado al agregar al carrito                      |
| Stock UI              | Warning si `checkOrderStock` falla para composición actual (no bloqueo)             |

## Scope IN

- Ruta `/sorpresas/[id]/personalizar` — wizard multi-paso o single-page (UX a criterio; lógica fija)
- Cargar plantilla: `getPublicBundle` + items + container
- Estado wizard: `components: { productId, quantityPerUnit }[]` alineado con `orderBundleComponentInputSchema`
- Panel “Agregar dulce”: buscador sobre catálogo activo (reutilizar listado S3A-1)
- Quitar / reemplazar con validación min/max
- Preview precio en vivo: `computeBundleTotal` + `buildShoppingCart` (1 línea bundle, `quantity` = plantilla.personas)
- Validación Zod `customizeBundleInputSchema` (min 5, max 20, productos únicos, activos)
- Salida: `CartBundleLine` tipado (ver S3A-3) — “Agregar al carrito” (si carrito no listo, guardar en sessionStorage stub)
- i18n — wizard, límites, warnings stock
- Vitest — validación min/max, precio igual admin para misma composición
- Playwright — `apps/ecommerce/e2e/bundle-wizard-smoke.spec.ts`: abrir plantilla, quitar 1 dulce, agregar otro, ver total

## Scope OUT (traps)

- **NO editar número de personas** — fijo en plantilla
- **NO `enableUnitsPerPerson` UI activa** en v1 (flag false)
- **NO bloqueo por stock** — solo banner warning
- **NO crear orden** — S3A-3
- **NO múltiples sorpresas distintas en un solo wizard** — 1 plantilla → 1 línea carrito; cantidad de **pedidos** de esa sorpresa = 1 en v1 (personas = `bundle.quantity` en precio)
- **NO `index.ts` barrels**

> **Nota precio:** `bundles.quantity` = personas que cubre la plantilla; `line.quantity` en orden = número de sorpresas físicas. v1 wizard produce **una** sorpresa configurada; el carrito puede duplicar línea en S3A-3 si se permite cantidad >1 allí.

## Tablas y RLS

Sin migración. Lectura pública catálogo existente.

## Boundaries y DTOs

| Boundary                      | Tipo          | Input                        | Output                                        |
| ----------------------------- | ------------- | ---------------------------- | --------------------------------------------- |
| `getBundleForWizard`          | Server Action | `{ bundleId }`               | Plantilla + items + container + `personCount` |
| `previewBundleLine`           | Server Action | `customizeBundleInputSchema` | `{ lineTotal, components, stockCheck }`       |
| `validateBundleCustomization` | shared/Zod    | components[]                 | ok / error codes                              |

`customizeBundleInputSchema`:

```typescript
{
  bundleId: string; // uuid plantilla
  components: Array<{ productId: string; quantityPerUnit: number }>; // min 5 max 20 unique
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

- [ ] No se puede guardar con <5 o >20 productos
- [ ] No se puede guardar con productos duplicados
- [ ] Precio preview = admin order-form para misma composición (± S/ 0.01)
- [ ] Quitar item default y agregar otro del catálogo respeta mínimo
- [ ] Warning stock visible cuando `checkOrderStock` falla; wizard sigue permitiendo continuar
- [ ] `enableUnitsPerPerson=false` → no input de cantidad por dulce en UI
- [ ] Vitest — `customize-bundle.test.ts`
- [ ] Playwright — wizard smoke verde
- [ ] `pnpm check` + `pnpm build` verdes

## Preguntas abiertas

- Ninguna — límites 5/20 y flags cerrados.

## Depends on

- [01-catalog-products-bundles.md](01-catalog-products-bundles.md)
- [business-rules.md](../../business-rules.md) Regla 7

## Bloquea

- S3A-3 (líneas bundle personalizadas en carrito)
