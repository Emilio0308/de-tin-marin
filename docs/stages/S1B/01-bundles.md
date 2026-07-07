# S1B · Catálogo — Bundles (plantillas sorpresa, admin)

|                |                                                                                   |
| -------------- | --------------------------------------------------------------------------------- |
| **Etapa**      | S1B — Bundles ([roadmap.md](../../roadmap.md) § S1B)                              |
| **Owner**      | Equipo De Tin Marín                                                               |
| **App(s)**     | `apps/admin`                                                                      |
| **Schemas**    | `catalog`                                                                         |
| **Depende de** | [S1A/01-catalog-products-categories.md](../S1A/01-catalog-products-categories.md) |
| **Estado**     | approved                                                                          |

## Contexto (leer esto, no todo docs/)

- S1A ✅ — `catalog.products`/`catalog.categories` con RLS y grants; auth staff + `requireStaff`; patrón Action → Service → Repository; `guardAction`/`logServerError` obligatorio en actions ([rules/40](../../rules/40-validation-and-boundaries.md)).
- Modelo base en [database.md](../../database.md) § catalog.
- **DECISIONS #5** — bundles **no tienen stock**; son plantillas por demanda. Solo `products` tiene `stock_quantity`.
- **DECISIONS #6** — precio del bundle **dinámico, NO persistido**; se recalcula en cada consulta desde componentes vivos.
- **DECISIONS #22** — bundle = plantilla con `quantity` (personas/porciones) + `service_fee`; `bundle_items` con `units_per_person` (v1 = 1).
- **Invariante 9/11** — pricing se calcula en backend; el bundle es plantilla y su precio se **congela** recién al crear la orden (`orders.shopping_cart`, S2B) — no aquí.
- Los componentes referencian **solo `catalog.products`** (sin bundles anidados).
- Grants: cada tabla nueva en schema propio necesita `GRANT` para `anon`/`authenticated` (lección S1A, ver `00003_api_grants.sql`).

### Modelo de precios (dinámico — decisión de esta sesión)

El bundle **no guarda precio**. El operador define solo: `service_fee`, `quantity` (personas) y qué productos vincula (con `units_per_person`, v1 = 1). El precio se calcula en vivo:

```text
itemsSubtotal = Σ (product.prices.unit.netPrice × units_per_person)
total         = service_fee + quantity × itemsSubtotal
```

> **Post-S1D:** el precio por componente usa `prices.unit.netPrice` (unidad base). Pre-S1D el código leía `prices.normal.netPrice` (equivalente cuando `items_per_package = 1`).

**Ejemplo** (`pack premium`): `service_fee = 30`, `quantity = 20`, galleta S/1 (×1) + chocolate S/2 (×1):

```text
itemsSubtotal = 1×1 + 2×1 = 3
total         = 30 + 20 × 3 = 90
```

Si mañana la galleta sube a S/1.50, el total se recalcula solo. Sin stale, sin snapshot hasta la orden (S2B).

## Objetivo

Un usuario staff autenticado en admin (:3001) puede crear, listar, editar y soft-delete plantillas de sorpresa (bundles) con imagen, `service_fee` y `quantity` (personas), vinculando productos con su `units_per_person`, y ver el precio total calculado en vivo.

## Scope IN

- Migración `00004_catalog_bundles.sql` + pgTAP (`catalog.bundles` con `image_url`, `service_fee`, `quantity`; `catalog.bundle_items` con `units_per_person`; RLS; grants; triggers `updated_at`)
- Validaciones Zod: `bundle` (input/output) en `@de-tin-marin/validations`
- Helper `computeBundleTotal({ serviceFee, quantity, items })` → `{ itemsSubtotal, total }` en `@de-tin-marin/shared` + Vitest
- Módulo `apps/admin/src/modules/catalog/` extendido: `bundle.repository`, `bundle.service`, actions, DTOs
- UI admin: listado de bundles + formulario create/edit (imagen URL, `service_fee`, `quantity`, selector de productos con `units_per_person`, agregar/quitar filas) mostrando el total calculado en vivo + soft-delete
- Navegación admin: entrada "Bundles"

## Scope OUT (traps)

- **NO stock en bundles** — sin `stock_quantity` en `bundles` → _overselling / DECISIONS #5_
- **NO columna `prices` en bundles** — el precio es dinámico, calculado siempre → _stale / DECISIONS #6_
- **NO campañas ni `finalPrice` con descuento** — el total usa `products.prices.unit.netPrice` (post-S1D); precio final campaña-aware es S1C → _pricing boundary violation_
- **NO bundles anidados** — `bundle_items.product_id` solo apunta a `products` → _ciclos / complejidad_
- **NO personalización ni snapshot de orden** — eso va en `shopping_cart` (S2B) → _invariante 11_
- **NO `units_per_person` editable en UI v1** — se fija en `1`; el campo existe en tabla para v2 → _scope creep_
- **NO ecommerce UI** → S3A
- **NO Supabase Storage** — `image_url` es solo URL texto (como productos en S1A) → _scope creep_
- **NO `index.ts` barrels**

## Tablas y RLS

**`catalog.bundles`** columnas: `name`, `description`, `image_url text` nullable, `service_fee numeric(12,2)`, `quantity int (>= 1)`, `is_active`, `deleted_at`. **Sin `prices`, sin `stock`.**
**`catalog.bundle_items`**: `bundle_id`, `product_id`, `units_per_person int (>= 1, default 1)`, unique `(bundle_id, product_id)`.

| Tabla (schema)         | ¿Nueva? | Ops                                            | Política (prosa)                                                               | pgTAP                                      |
| ---------------------- | ------- | ---------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------ |
| `catalog.bundles`      | sí      | SELECT público activos; staff all; CUD staff   | Público lee `is_active AND deleted_at IS NULL`; staff (`core.is_staff()`) todo | `supabase/tests/catalog__bundles.sql`      |
| `catalog.bundle_items` | sí      | SELECT público (de bundles activos); CUD staff | Lectura pública; escritura solo staff vía `core.is_staff()`                    | `supabase/tests/catalog__bundle_items.sql` |

Grants en `00004`: `GRANT SELECT` a `anon, authenticated`; `GRANT INSERT, UPDATE, DELETE` a `authenticated` sobre ambas tablas.

## Boundaries y DTOs

| Boundary           | Tipo          | Input (Zod)               | Output DTO (allowlist)                                                                                                                                         |
| ------------------ | ------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listBundles`      | Server Action | —                         | `{ id, name, imageUrl, serviceFee, quantity, itemCount, total, isActive }[]`                                                                                   |
| `getBundle`        | Server Action | `{ id: uuid }`            | `{ id, name, description, imageUrl, serviceFee, quantity, isActive, items: { productId, productName, unitNetPrice, unitsPerPerson }[], itemsSubtotal, total }` |
| `createBundle`     | Server Action | `createBundleInputSchema` | `{ ok, id? }`                                                                                                                                                  |
| `updateBundle`     | Server Action | `updateBundleInputSchema` | `{ ok }`                                                                                                                                                       |
| `softDeleteBundle` | Server Action | `{ id: uuid }`            | `{ ok }`                                                                                                                                                       |

- `createBundleInputSchema`: `{ name, description?, imageUrl?, serviceFee: number>=0, quantity: int>=1, isActive, items: { productId: uuid, unitsPerPerson: int>=1 }[] (min 1) }`.
- Toda action envuelta en `guardAction(scope, run)` + `requireStaff` (patrón S1A).
- `total` e `itemsSubtotal` **calculados en backend** (helper `computeBundleTotal`); nunca se persisten.

## Rules que aplican

- Invariantes **3, 4, 8, 9, 11, 13, 15** ([CLAUDE.md](../../../CLAUDE.md))
- [`rules/00-architecture.md`](../../rules/00-architecture.md)
- [`rules/10-auth-and-authorization.md`](../../rules/10-auth-and-authorization.md)
- [`rules/30-rls-and-postgres.md`](../../rules/30-rls-and-postgres.md)
- [`rules/40-validation-and-boundaries.md`](../../rules/40-validation-and-boundaries.md) (incl. manejo de errores `guardAction`)
- [`rules/85-react-components.md`](../../rules/85-react-components.md)

## Orden de implementación

1. Migración `00004` (`bundles` con `quantity`, `bundle_items` con `units_per_person`) + grants + pgTAP → `supabase db push` → `pnpm gen:db-types`
2. Zod `bundle` + helper `computeBundleTotal` + Vitest
3. `bundle.repository` (join items + productos, trae `prices.normal.netPrice`) → `bundle.service` (DTO + total) → actions
4. UI: listado bundles + formulario (imagen, fee, quantity, selector componentes con total en vivo) — container/presentational + test de render
5. Navegación admin + Playwright smoke
6. `pnpm check` + `pnpm build`; docs ya sincronizados (`database.md`, `DECISIONS.md` #6/#22); actualizar `roadmap.md`

## Criterios de aceptación

- [ ] `supabase db push` aplica `00004` sin error; `catalog.bundles` con `quantity`/`image_url` y `bundle_items.units_per_person`, con grants
- [ ] Vitest — `packages/shared/src/bundle-price.test.ts`: `total = service_fee + quantity × Σ(precio × units_per_person)` (ejemplo pack premium = 90)
- [ ] Vitest — `packages/validations/src/bundle.test.ts`: `serviceFee >= 0`, `quantity >= 1` entero, `items` min 1, `unitsPerPerson >= 1` entero
- [ ] pgTAP — `catalog__bundles.sql`, `catalog__bundle_items.sql`: RLS staff-only write
- [ ] Vitest render — formulario de bundle (agregar/quitar componente, total en vivo)
- [ ] Playwright — `apps/admin/e2e/bundles-smoke.spec.ts`: crear bundle y verlo en listado
- [ ] `pnpm check` + `pnpm build` verdes
- [ ] Staff puede CRUD bundles con componentes en admin

## Preguntas abiertas

- Ninguna — decisiones cerradas: imagen (`image_url` URL texto), `quantity` bundle (personas, entero), `units_per_person` por producto (v1 = 1), precio 100 % dinámico (DECISIONS #6, #22).

## Depends on

- [database.md](../../database.md) § catalog (`catalog.bundles`, `catalog.bundle_items`)
- [DECISIONS.md](../../DECISIONS.md) #5, #6, #22
