# S1E · Insumos — Envases de sorpresa + configuración de delivery

|                |                                                                 |
| -------------- | --------------------------------------------------------------- |
| **Etapa**      | S1E — Envases + delivery ([roadmap.md](../../roadmap.md) § S1E) |
| **Owner**      | Equipo De Tin Marín                                             |
| **App(s)**     | `apps/admin`                                                    |
| **Schemas**    | `catalog`, `pricing`                                            |
| **Depende de** | S1B ✅, S1D ✅, S2B ✅                                          |
| **Estado**     | approved                                                        |

## Contexto (leer esto, no todo docs/)

- S1D ✅ — productos con presentación, `prices.unit`, stock sealed/loose. Bundles calculan con `prices.unit.netPrice`.
- S2B ✅ — órdenes con `shopping_cart` congelado; líneas bundle llevan `serviceFee` congelado hoy.
- **DECISIONS #30** ⏸ — `service_fee` fijo se reemplaza por **inventario de envases** (insumos, tabla aparte de productos); **delivery** en tabla de configuración, no embebido en bundles.
- Los envases **no son productos vendibles** al público: son insumos operativos (caja, bolsa, canasto) con stock propio y precio que entra al total de la sorpresa.
- Hoy `orders.shipping_total` existe pero siempre **0** al crear orden; `fulfillment` guarda método/dirección por pedido sin tarifa configurable.
- **S2A** (deduct al pagar) depende de S1D para dulces; **tras S1E** debe extenderse para descontar stock de envases (brief S2A se actualiza, no se implementa deduct de envases en S1E).
- Órdenes ya creadas con `serviceFee` en `shopping_cart` **no se migran** — snapshot congelado (Regla 16 / invariante 11).

## Objetivo

Un operador staff puede CRUD **envases de sorpresa** (insumos con stock y precio), asignar un envase por plantilla bundle (reemplazando `service_fee`), y configurar **tarifas de delivery por distrito**; el admin calcula preview de bundle, creación de orden y `shipping_total` con esas fuentes.

## Scope IN

- Migración `00009_surprise_containers_delivery.sql` + pgTAP
- Tabla **`catalog.surprise_containers`** (insumos — no `catalog.products`)
- Tablas **`pricing.delivery_zones`** + **`pricing.delivery_settings`** (singleton)
- Alter **`catalog.bundles`**: `container_id` FK; **drop** `service_fee` tras backfill
- Backfill bundles: envase por bundle con `netPrice = service_fee / quantity` (preserva total plantilla)
- `@de-tin-marin/shared`: `computeBundleTotal` con envase; `resolveDeliveryFee`; tipos `shopping_cart` bundle actualizados
- `@de-tin-marin/validations`: schemas envase, delivery zone, bundle input (sin `serviceFee`, con `containerId`)
- Admin módulo catalog: CRUD envases (listado + formulario stock/precio)
- Admin módulo settings o pricing: CRUD zonas delivery + settings globales
- Admin bundle form: selector de envase (reemplaza campo fee); total en vivo
- Admin order form: `shipping_total` desde distrito en `fulfillment.deliveryAddress.district`
- Docs canónicos: `database.md`, `DECISIONS.md` (#30 ✅), `business-rules.md` (Reglas 8, nueva Regla delivery), `pricing.md`, `orders.md`, `inventory.md`
- Actualizar README módulos catalog / orders

## Scope OUT (traps)

- **NO `deduct_stock_for_order` para envases** — extensión S2A → _premature deduct_
- **NO validación de stock de envase pre-pago** — S2A
- **NO migrar `shopping_cart` histórico** — órdenes existentes conservan `serviceFee` → _romper snapshots_
- **NO envases en ecommerce público** — insumos solo admin; el cliente ve precio bundle total → S3A
- **NO pasarela / cupones / free-shipping campaigns** — v1 tarifa fija por distrito
- **NO geocoding / mapas / radio km** — solo match por nombre de distrito (texto)
- **NO schema `inventory` ledger** — v2
- **NO `index.ts` barrels**
- **NO presentaciones sealed/loose en envases** — stock entero simple (1 envase = 1 unidad)

## Modelo de datos

### `catalog.surprise_containers` (nueva — insumos)

| Columna          | Tipo        | Notas                                                             |
| ---------------- | ----------- | ----------------------------------------------------------------- |
| `id`             | uuid PK     | `gen_random_uuid()`                                               |
| `sku`            | text        | Único entre activos (`deleted_at IS NULL`)                        |
| `name`           | text        | Ej. "Caja mediana", "Bolsa kraft"                                 |
| `description`    | text        | Opcional                                                          |
| `image_url`      | text        | URL texto (sin Storage v1)                                        |
| `prices`         | jsonb       | Bloque único `{ netPrice, igv, subtotal }` (Regla 2 simplificada) |
| `stock_quantity` | int         | `>= 0`; **1 envase = 1 unidad**                                   |
| `is_active`      | boolean     | default `true`                                                    |
| `deleted_at`     | timestamptz | Soft delete                                                       |
| `created_at`     | timestamptz |                                                                   |
| `updated_at`     | timestamptz |                                                                   |

> **Distinto de productos:** sin `product_type`, `items_per_package`, `prices.unit`, campañas ni categorías. No aparece en carrito como línea `type: "product"`.

**Precio envase:** operador ingresa `netPrice` (IGV incluido); backend calcula `igv`/`subtotal` con mismo helper que productos (`buildPriceFromNetPrice` o equivalente).

### Alter `catalog.bundles`

| Cambio            | Detalle                                                             |
| ----------------- | ------------------------------------------------------------------- |
| `container_id`    | uuid NOT NULL FK → `catalog.surprise_containers` ON DELETE RESTRICT |
| ~~`service_fee`~~ | **Drop** tras backfill                                              |

**Backfill:**

```sql
-- Por cada bundle: crear o reutilizar envase con netPrice = service_fee / quantity
-- Asignar container_id; luego DROP service_fee
```

Si `quantity = 0` (imposible por constraint) no aplica. Si `service_fee = 0`, envase "Sin costo" con precio 0.

### Precio bundle (post-S1E)

**Plantilla (preview admin):**

```text
itemsSubtotalPerSorpresa = Σ (product.prices.unit.netPrice × units_per_person)
total = bundle.quantity × (container.prices.netPrice + itemsSubtotalPerSorpresa)
```

**Línea en orden (`shopping_cart`):**

```text
line_total =
  Σ (total_quantity × unit_price_producto)
  + containerUnitPrice × line.quantity    // 1 envase por sorpresa, congelado
```

**Ejemplo:** envase S/ 2.50, 20 sorpresas en plantilla, galleta S/1 + chocolate S/2 por sorpresa:

```text
itemsSubtotalPerSorpresa = 3
total = 20 × (2.50 + 3) = 110
```

### `pricing.delivery_zones` (nueva)

| Columna      | Tipo          | Notas                                           |
| ------------ | ------------- | ----------------------------------------------- |
| `id`         | uuid PK       |                                                 |
| `district`   | text          | **Unique** — nombre distrito (ej. "Miraflores") |
| `fee`        | numeric(12,2) | Tarifa delivery `>= 0`                          |
| `is_active`  | boolean       | default `true`                                  |
| `sort_order` | int           | Orden en UI admin                               |
| `created_at` | timestamptz   |                                                 |
| `updated_at` | timestamptz   |                                                 |

### `pricing.delivery_settings` (nueva — singleton)

Una fila fija (`id` constante o `singleton_key = 'default'` UNIQUE).

| Columna            | Tipo          | Notas                                        |
| ------------------ | ------------- | -------------------------------------------- |
| `pickup_enabled`   | boolean       | default `true`                               |
| `delivery_enabled` | boolean       | default `true`                               |
| `fallback_fee`     | numeric(12,2) | Tarifa si distrito no está en zonas (`>= 0`) |
| `updated_at`       | timestamptz   |                                              |

**Resolución al crear orden:**

```text
si fulfillment.method = 'pickup' → shipping_total = 0
si fulfillment.method = 'delivery':
  fee = delivery_zones.fee WHERE district ILIKE match AND is_active
     OR delivery_settings.fallback_fee
shipping_total congelado en orders.shipping_total
```

Match v1: **igualdad case-insensitive** trim en `district` vs `fulfillment.deliveryAddress.district`.

### `shopping_cart` — línea bundle (nuevo contrato)

Solo órdenes **nuevas** post-S1E:

```typescript
{
  type: "bundle";
  bundleId: string;
  name: string;
  quantity: number; // nº sorpresas
  container: {
    containerId: string;
    sku: string;
    name: string;
    unitPrice: number; // netPrice congelado
  };
  lineTotal: number;
  components: Array<{ ... }>; // sin cambio
}
```

**Compat lectura:** si línea legacy trae `serviceFee` (sin `container`), UI/order helpers siguen mostrando fee antiguo — no recalcular.

## Tablas y RLS

| Tabla (schema)                | ¿Nueva? | Ops                               | Política (prosa)                            | pgTAP                                             |
| ----------------------------- | ------- | --------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| `catalog.surprise_containers` | sí      | SELECT público activos; CUD staff | Público lee activos no borrados; staff todo | `supabase/tests/catalog__surprise_containers.sql` |
| `catalog.bundles`             | alter   | —                                 | Sin cambio RLS; FK `container_id`           | extender `catalog__bundles.sql`                   |
| `pricing.delivery_zones`      | sí      | SELECT público activos; CUD staff | Público lee zonas activas; staff CRUD       | `supabase/tests/pricing__delivery_zones.sql`      |
| `pricing.delivery_settings`   | sí      | SELECT público; UPDATE staff      | Lectura pública; escritura staff            | `supabase/tests/pricing__delivery_settings.sql`   |

Grants: `GRANT SELECT` a `anon, authenticated`; `GRANT INSERT, UPDATE, DELETE` a `authenticated` en tablas nuevas (patrón `00003_api_grants.sql`).

Checks Postgres:

```sql
-- surprise_containers
stock_quantity >= 0
prices->>'netPrice' is not null  -- o check vía trigger/app

-- delivery_zones
fee >= 0

-- delivery_settings
fallback_fee >= 0
```

## Boundaries y DTOs

### Envases

| Boundary                      | Tipo          | Input (Zod)                     | Output DTO (allowlist)                                   |
| ----------------------------- | ------------- | ------------------------------- | -------------------------------------------------------- |
| `listSurpriseContainers`      | Server Action | —                               | `{ id, sku, name, netPrice, stockQuantity, isActive }[]` |
| `getSurpriseContainer`        | Server Action | `{ id }`                        | Detalle + `prices`                                       |
| `createSurpriseContainer`     | Server Action | `createSurpriseContainerSchema` | `{ ok, id? }`                                            |
| `updateSurpriseContainer`     | Server Action | `updateSurpriseContainerSchema` | `{ ok }`                                                 |
| `softDeleteSurpriseContainer` | Server Action | `{ id }`                        | `{ ok }` — rechazar si bundles activos lo referencian    |

### Delivery

| Boundary                 | Tipo          | Input (Zod)               | Output DTO (allowlist)                            |
| ------------------------ | ------------- | ------------------------- | ------------------------------------------------- |
| `listDeliveryZones`      | Server Action | —                         | `{ id, district, fee, isActive, sortOrder }[]`    |
| `upsertDeliveryZone`     | Server Action | `deliveryZoneInputSchema` | `{ ok, id? }`                                     |
| `deleteDeliveryZone`     | Server Action | `{ id }`                  | `{ ok }`                                          |
| `getDeliverySettings`    | Server Action | —                         | `{ pickupEnabled, deliveryEnabled, fallbackFee }` |
| `updateDeliverySettings` | Server Action | `deliverySettingsSchema`  | `{ ok }`                                          |
| `resolveDeliveryFee`     | Server Action | `{ district: string }`    | `{ fee: number }` — uso interno order form        |

### Bundles / órdenes (cambios)

| Boundary       | Cambio                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| `createBundle` | Input: `containerId` reemplaza `serviceFee`; validar envase activo             |
| `getBundle`    | Output: `containerId`, `containerName`, `containerNetPrice`, `total`           |
| `createOrder`  | Calcula `shipping_total` vía `resolveDeliveryFee`; bundle line con `container` |

**Input bundle (nuevo):**

```typescript
{
  name: string;
  description?: string;
  imageUrl?: string;
  containerId: string;   // reemplaza serviceFee
  quantity: number;      // personas en plantilla
  isActive: boolean;
  items: { productId: string; unitsPerPerson: number }[];
}
```

## Rules que aplican

- Reglas **5–8** actualizadas ([business-rules.md](../../business-rules.md))
- Nueva **Regla 19** — Delivery: tarifa desde `pricing.delivery_zones` o `fallback_fee`; pickup = 0; congelar en `shipping_total`
- Nueva **Regla 20** — Envases: stock en `surprise_containers.stock_quantity`; 1 envase por sorpresa; no vendibles como producto
- DECISIONS **#5, #6, #22, #30** (resolver #30)
- [`rules/40-validation-and-boundaries.md`](../../rules/40-validation-and-boundaries.md)
- [`rules/30-rls-and-postgres.md`](../../rules/30-rls-and-postgres.md)

## Orden de implementación

1. Docs canónicos (este brief + `DECISIONS` #30, `database.md`, reglas) — **antes de migrar**
2. Migración `00009` + backfill envases/bundles + pgTAP → `supabase db push` → `pnpm gen:db-types`
3. `@de-tin-marin/shared` — `computeBundleTotal` (container), `resolveDeliveryFee`, `order-cart` bundle line + compat legacy + Vitest
4. `@de-tin-marin/validations` — envase, delivery, bundle sin `serviceFee` + Vitest
5. Admin: módulo envases (repo/service/actions/UI)
6. Admin: delivery zones + settings (repo/service/actions/UI)
7. Admin: bundle form + order form + order detail (compat `serviceFee` legacy)
8. `pnpm check` + `pnpm build`; actualizar `roadmap.md`

## Criterios de aceptación

- [ ] `supabase db push` aplica `00009` sin error; `service_fee` eliminado; bundles con `container_id`
- [ ] Backfill: total plantilla bundle **igual** antes/después para bundles existentes (± S/ 0.01 redondeo)
- [ ] Vitest — `packages/shared/src/bundle-price.test.ts`: total con envase × quantity
- [ ] Vitest — `packages/shared/src/delivery-fee.test.ts`: match distrito, fallback, pickup = 0
- [ ] Vitest — `packages/shared/src/order-cart.test.ts`: línea bundle con `container`; lectura legacy `serviceFee`
- [ ] Vitest — `packages/validations/src/bundle.test.ts`: `containerId` uuid requerido; sin `serviceFee`
- [ ] pgTAP — RLS staff write en envases y delivery
- [ ] Admin: CRUD envase; bundle con selector envase; orden delivery Miraflores suma tarifa correcta
- [ ] Admin order detail: órdenes legacy con `serviceFee` siguen renderizando
- [ ] `pnpm check` + `pnpm build` verdes

## Preguntas abiertas

- **Seed distritos Lima:** ¿lista inicial en migración (Miraflores, San Isidro, …) o solo UI vacía? → **Cerrado:** seed **Piura** — Piura, Castilla, 26 de Octubre, La Unión, Catacaos + `fallback_fee` S/ 20.
- **Ajuste manual stock envase:** ¿misma pantalla que productos o solo formulario envase? → **v1:** campo `stock_quantity` editable en formulario envase (sin audit_log — S2A/S4).

## Depends on

- [database.md](../../database.md) § bundles, orders, pricing
- [DECISIONS.md](../../DECISIONS.md) #30
- [S1B/01-bundles.md](../S1B/01-bundles.md), [S1D/01-products-packages-stock.md](../S1D/01-products-packages-stock.md)
- [S2B/01-orders.md](../S2B/01-orders.md)

## Bloquea

- **S2A** — extender `deduct_stock_for_order` para descontar `surprise_containers.stock_quantity` (1 × sorpresas por línea bundle)
- **S3A** — checkout ecommerce necesita envase embebido en precio bundle + delivery zones públicas
