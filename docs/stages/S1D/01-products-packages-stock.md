# S1D · Catálogo — Presentaciones, precios dual y stock por paquetes

|                |                                                                |
| -------------- | -------------------------------------------------------------- |
| **Etapa**      | S1D — Refactor catálogo ([roadmap.md](../../roadmap.md) § S1D) |
| **Owner**      | Equipo De Tin Marín                                            |
| **App(s)**     | `apps/admin`                                                   |
| **Schemas**    | `catalog`                                                      |
| **Depende de** | S1A ✅, S1B ✅, S1C ✅                                         |
| **Estado**     | approved                                                       |

## Contexto (leer esto, no todo docs/)

- Los proveedores entregan productos en **presentaciones** (tiras, paquetes), no solo bolsas sueltas. Ej.: Lay’s tira = 10 bolsas; galletas paquete = 12 unidades.
- **Unidad base de consumo** = bolsa/unidad que va en cada sorpresa. Bundles y deduct de stock operan siempre en unidad base.
- Hoy `prices.normal` = precio por bolsa (`items_per_package` implícito = 1) y `stock_quantity` = entero simple — insuficiente para paquetes abiertos con remanente.
- **DECISIONS #27–#29** — modelo cerrado en sesión 2026-07-06.
- S2B/S2C ✅ — órdenes y pagos existen; **S2A** (deduct al pagar) **depende de S1D** para el algoritmo sealed/loose.
- Bundles siguen sin stock; `service_fee` fijo se mantiene en v1 (envases de sorpresa → etapa posterior).

## Objetivo

Los productos modelan presentación + unidad base: precios `normal` (paquete) y `unit` (bolsa) coherentes, stock en paquetes cerrados + unidades sueltas, y bundles calculan con `prices.unit.netPrice`.

## Scope IN

- Migración `00008_catalog_products_packages_stock.sql` + pgTAP
- Columnas nuevas en `catalog.products` (ver [database.md](../../database.md))
- Backfill desde `stock_quantity` → `stock_sealed_packages=0`, `stock_loose_base_units=stock_quantity`
- Backfill `prices.unit` = copia de `prices.normal` (todos los productos actuales son unitarios implícitos)
- `product_type = 'unit'`, `items_per_package = 1` por defecto en filas existentes
- Deprecar `stock_quantity` (drop en migración o columna nullable sin uso — **decisión: drop tras backfill**)
- `@de-tin-marin/shared`: `buildPricesFromPackageNetPrice`, tipos `Prices` con `unit`
- `@de-tin-marin/validations`: `pricesSchema` con `unit` + coherencia `items_per_package`
- Admin: formulario producto — tipo, `items_per_package`, `package_label`, precio presentación (calcula `unit`), stock sealed + loose + total derivado
- `bundle.repository` / `bundle.service`: leer `prices.unit.netPrice` (no `normal`)
- Reglas 2, 4, 8, 9, 15 actualizadas en docs
- Actualizar módulo catalog README

## Scope OUT (traps)

- **NO `deduct_stock_for_order`** — S2A → _premature stock deduct_
- **NO cambiar `shopping_cart` schema** — ya usa `unitPrice` por línea; S2A leerá `totalQuantity` en unidad base
- **NO envases de sorpresa / quitar `service_fee`** — etapa futura → _scope creep_
- **NO `product_type = 'unit'` operativo distinto de package** — reservado; v1 solo `package` con `items_per_package >= 1`
- **NO schema `inventory` ledger** — v2
- **NO ecommerce** → S3A
- **NO CRUD campañas** — S1C fundación sin cambio
- **NO editar `normal` y `unit` independientemente** — una fuente en formulario, la otra calculada al guardar

## Modelo de datos

### Columnas nuevas — `catalog.products`

| Columna                  | Tipo      | Notas                                          |
| ------------------------ | --------- | ---------------------------------------------- |
| `product_type`           | text      | `'package'` \| `'unit'` — v1 default `'unit'`  |
| `items_per_package`      | int       | `>= 1`; unidades base por presentación         |
| `package_label`          | text null | UX: `"tira"`, `"paquete"` — no afecta cálculos |
| `stock_sealed_packages`  | int       | Paquetes/tiras **cerrados** (`>= 0`)           |
| `stock_loose_base_units` | int       | Bolsas sueltas de paquetes abiertos (`>= 0`)   |

**Eliminar:** `stock_quantity` (tras backfill).

### Estructura `prices` (JSONB)

```json
{
  "normal": {
    "netPrice": 6.0,
    "igv": 0.92,
    "subtotal": 5.08
  },
  "unit": {
    "netPrice": 0.6,
    "igv": 0.09,
    "subtotal": 0.51
  },
  "suggested": {},
  "fantasy": {}
}
```

| Clave    | Significado                                      |
| -------- | ------------------------------------------------ |
| `normal` | Precio de la **presentación** (tira/paquete)     |
| `unit`   | Precio por **unidad base** (bolsa) — bundles/S2A |

**Escritura:** el operador ingresa precio de presentación (`normal.netPrice`). Backend calcula `unit` con `buildPricesFromPackageNetPrice(packageNetPrice, itemsPerPackage)`.

**Validación (Regla 2):** ambos bloques pasan `priceNormalSchema` y `|unit.netPrice × items_per_package − normal.netPrice| ≤ 0.01`.

Si `items_per_package = 1`, `normal` y `unit` deben ser idénticos.

### Stock — fuente de verdad

```text
totalBaseUnits = stock_sealed_packages × items_per_package + stock_loose_base_units
```

**Normalización** (después de cada movimiento):

```text
si stock_loose_base_units >= items_per_package:
  stock_sealed_packages += floor(loose / items_per_package)
  stock_loose_base_units = loose % items_per_package
```

**Display admin:** `"2 tiras + 5 bolsas"` cuando `package_label = 'tira'`, `items_per_package = 10`, `sealed = 2`, `loose = 5`.

### Ejemplo Lay’s

| Campo                    | Valor                             |
| ------------------------ | --------------------------------- |
| `items_per_package`      | 10                                |
| `package_label`          | `"tira"`                          |
| `prices.normal.netPrice` | S/ 6.00 (tira)                    |
| `prices.unit.netPrice`   | S/ 0.60 (bolsa)                   |
| Stock inicial            | `sealed=5`, `loose=0` → 50 bolsas |

Pedido 25 bolsas (25 sorpresas × 1 Lay’s):

```text
need = 25
loose -= min(25, 0) = 0
Abrir 3 tiras: consume 25, sobran 5 → sealed=2, loose=5
```

### Precio bundle (post-S1D)

```text
itemsSubtotal = Σ (product.prices.unit.netPrice × units_per_person)
total         = service_fee + quantity × itemsSubtotal
```

Con campaña activa (preview/listado):

```text
finalUnitPrice = computeFinalPrice(normal.netPrice, campaign) / items_per_package
```

Campaña aplica sobre **presentación** (`normal`); unidad final derivada.

## Tablas y RLS

| Tabla (schema)     | ¿Nueva? | Ops | Política (prosa)                 | pgTAP                                  |
| ------------------ | ------- | --- | -------------------------------- | -------------------------------------- |
| `catalog.products` | alter   | —   | Sin cambio RLS (columnas nuevas) | `supabase/tests/catalog__products.sql` |

Checks Postgres:

```sql
product_type in ('unit', 'package')
items_per_package >= 1
stock_sealed_packages >= 0
stock_loose_base_units >= 0
```

## Boundaries y DTOs

| Boundary        | Tipo          | Input (Zod)                | Output DTO (allowlist)                                                                                                                                     |
| --------------- | ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listProducts`  | Server Action | —                          | `{ ..., netPrice, unitNetPrice, itemsPerPackage, productType, packageLabel, stockSealedPackages, stockLooseBaseUnits, stockTotalBaseUnits, finalPrice }[]` |
| `getProduct`    | Server Action | `{ id }`                   | Igual detalle + `prices` normal/unit                                                                                                                       |
| `createProduct` | Server Action | `createProductInputSchema` | `{ ok, id? }`                                                                                                                                              |
| `updateProduct` | Server Action | `updateProductInputSchema` | `{ ok }`                                                                                                                                                   |

**Input producto (nuevo):**

```typescript
{
  // ... campos existentes
  productType: 'package' | 'unit';  // v1 default 'unit'
  itemsPerPackage: number;          // int >= 1
  packageLabel?: string;
  packageNetPrice: number;            // fuente → genera prices.normal + prices.unit
  stockSealedPackages: number;
  stockLooseBaseUnits: number;
}
```

Helper compartido (para S2A, reutilizable):

```typescript
function normalizeProductStock(
  sealed: number,
  loose: number,
  itemsPerPackage: number,
): {
  sealedPackages: number;
  looseBaseUnits: number;
};

function deductBaseUnits(
  sealed: number,
  loose: number,
  itemsPerPackage: number,
  need: number,
): { sealedPackages: number; looseBaseUnits: number } | "INSUFFICIENT_STOCK";
```

## Rules que aplican

- Reglas **1–4**, **8–9** ([business-rules.md](../../business-rules.md))
- DECISIONS **#13, #14, #27–#29**
- [`rules/40-validation-and-boundaries.md`](../../rules/40-validation-and-boundaries.md)

## Orden de implementación

1. Docs canónicos (este brief + `database.md`, `DECISIONS`, reglas) — **hecho antes de migrar**
2. Migración `00008` + backfill + drop `stock_quantity` + pgTAP
3. `pnpm gen:db-types`
4. `@de-tin-marin/shared` — `Prices` + `buildPricesFromPackageNetPrice` + helpers stock + Vitest
5. `@de-tin-marin/validations` — `pricesSchema` + `product` input + Vitest
6. Admin product repo/service/actions/form — stock dual + precio presentación
7. Admin bundle repo — `prices.unit.netPrice`
8. `pnpm check` + `pnpm build`

## Criterios de aceptación

- [ ] `supabase db push` aplica `00008` sin error
- [ ] Productos existentes migrados: `items_per_package=1`, `unit` = `normal`, stock en `loose`
- [ ] Vitest — `packages/shared/src/prices.test.ts`: coherencia normal/unit + `buildPricesFromPackageNetPrice`
- [ ] Vitest — `packages/shared/src/product-stock.test.ts`: normalize + deduct (ejemplo Lay’s 25 de 50)
- [ ] Vitest — `packages/validations/src/prices.test.ts`: Regla 2 ampliada
- [ ] Vitest — `packages/shared/src/bundle-price.test.ts`: sigue verde con `unitNetPrice`
- [ ] pgTAP — checks columnas y constraints en `catalog__products.sql`
- [ ] Admin: crear producto paquete (10 u/paq) muestra stock "X paquetes + Y bolsas"
- [ ] `pnpm check` + `pnpm build` verdes

## Preguntas abiertas

- Ninguna — modelo cerrado 2026-07-06.

## Depends on

- [database.md](../../database.md) § products, prices, stock
- [inventory.md](../../inventory.md) § stock sealed/loose
- [DECISIONS.md](../../DECISIONS.md) #27, #28, #29

## Bloquea

- [S2A](../../roadmap.md) — `deduct_stock_for_order` usa algoritmo sealed/loose + unidades base
