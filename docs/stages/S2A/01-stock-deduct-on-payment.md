# S2A · Stock deduct al confirmar pago

|                |                                                                    |
| -------------- | ------------------------------------------------------------------ |
| **Etapa**      | S2A — Stock deduct al pagar ([roadmap.md](../../roadmap.md) § S2A) |
| **Owner**      | Equipo De Tin Marín                                                |
| **App(s)**     | `supabase`, `packages/shared`, `apps/admin`                        |
| **Schemas**    | `catalog`, `commerce`                                              |
| **Depende de** | S1D ✅, S1E ✅, S2C ✅                                             |
| **Estado**     | done                                                               |

## Contexto (leer esto, no todo docs/)

- S1D ✅ — productos con `stock_sealed_packages` + `stock_loose_base_units`; algoritmo sealed/loose en `@de-tin-marin/shared/product-stock` (`deductBaseUnits`, `normalizeProductStock`).
- S1E ✅ — envases en `catalog.surprise_containers` (`stock_quantity` entero); líneas bundle congeladas llevan `container` (1 envase × sorpresa). Órdenes legacy con `serviceFee` sin `container` — **no migrar** (Regla 16).
- S2C ✅ — `confirmPaymentService` inserta `payments` y marca orden `paid`; **hoy no descuenta stock** (DECISIONS #25).
- **Regla 15** — deduct atómico al pasar a `paid`: productos (sealed/loose) + envases; rollback total si falta stock.
- **Regla 18** — reembolso v1: reversión manual de productos **y** envases en admin.
- Snapshot `shopping_cart` es la única fuente de cantidades a descontar — no re-leer plantillas bundle.

## Objetivo

Al confirmar pago manual (S2C), la orden pasa a `paid` **solo si** hay stock suficiente de todos los productos (unidades base) y envases requeridos; el descuento ocurre en una transacción Postgres atómica junto con la confirmación de pago.

## Scope IN

- Migración `00010_deduct_stock_for_order.sql` + pgTAP
- RPC **`commerce.deduct_stock_for_order(p_order_id uuid)`** — `SECURITY DEFINER`, retorna `void` o lanza excepción `INSUFFICIENT_STOCK`
- Lógica deduct en Postgres (fuente de verdad), alineada con `deductBaseUnits` de shared:
  1. Líneas `type: product` → `quantity` unidades base del producto
  2. Líneas `type: bundle` → por cada `component`, `totalQuantity` unidades base
  3. Líneas bundle con `container` → `line.quantity` de `surprise_containers.stock_quantity`
  4. Líneas legacy solo con `serviceFee` → omitir paso envase
- Enganchar RPC en **`confirmPaymentService`** antes de marcar `paid` (misma transacción vía RPC que también actualiza orden, **o** RPC llamada desde service con rollback si falla — preferir **una función Postgres** `commerce.confirm_payment_and_deduct` si simplifica atomicidad; ver § Transacción)
- Helper **`checkOrderStock(order)`** en `@de-tin-marin/shared` (opcional v1 pero recomendado): simula deduct sin mutar; usado en UI pre-confirmación
- Admin detalle orden: banner/warning si `checkOrderStock` falla antes de confirmar pago
- Códigos de error service: `INSUFFICIENT_STOCK` (producto o envase), mensaje i18n
- Docs: [`inventory.md`](../../inventory.md), [`business-rules.md`](../../business-rules.md) Regla 15, [`orders.md`](../../orders.md) flujo pago paso 3
- Vitest — `checkOrderStock` + casos edge (legacy `serviceFee`, bundle multi-componente)
- pgTAP — RPC deduct: happy path, stock insuficiente producto, stock insuficiente envase, idempotencia (no re-deduct si ya `paid`)

## Scope OUT (traps)

- **NO ledger `inventory` schema** — v2
- **NO reversión automática al reembolsar** — Regla 18 manual v1
- **NO validación stock al crear orden** — opcional futuro; v1 solo pre-confirm + deduct atómico
- **NO deduct en cancelación `pending_payment`** — sin stock reservado v1
- **NO pasarela / webhooks** — S2C manual
- **NO ecommerce checkout** — S3A
- **NO `index.ts` barrels**
- **NO sealed/loose en envases** — stock entero simple (Regla 20)

## Algoritmo deduct (Postgres)

### Productos

Por cada demanda agregada por `product_id` (sumar líneas product + componentes bundle):

```text
need = unidades base totales requeridas
locked row: products FOR UPDATE
result = deductBaseUnits(sealed, loose, items_per_package, need)
si result = INSUFFICIENT_STOCK → RAISE
UPDATE products SET sealed, loose
```

Reutilizar la misma semántica que `packages/shared/src/product-stock.ts` (tests shared como referencia dorada).

### Envases

Por cada `container.containerId` en líneas bundle (con `container` presente):

```text
need = SUM(line.quantity) por container_id en la orden
locked row: surprise_containers FOR UPDATE
si stock_quantity < need → RAISE INSUFFICIENT_STOCK
UPDATE stock_quantity -= need
```

### Agregación

- Agrupar demandas por `product_id` y por `container_id` antes de mutar (evitar race dentro de la misma orden).
- Productos soft-deleted o inactivos en snapshot: **igual descontar** (snapshot congelado); si fila no existe → `INSUFFICIENT_STOCK`.

## Transacción con confirmación de pago

**Opción A (recomendada):** ampliar flujo en una sola RPC Postgres:

```sql
commerce.confirm_payment_with_stock_deduct(
  p_order_id uuid,
  p_staff_user_id uuid,
  p_notes text,
  p_payment_reference text
) RETURNS jsonb
```

Pasos internos (BEGIN implícito):

1. `SELECT ... FROM orders WHERE id = p_order_id FOR UPDATE`
2. Validar `status = pending_payment`, `payment_status != confirmed`
3. `PERFORM deduct_stock_for_order(p_order_id)` — función interna o inline
4. `INSERT INTO payments (...)`
5. `UPDATE orders SET status = paid, payment_status = confirmed, payment_methods = ...`
6. `RETURN` ids

**Opción B:** mantener inserts en TypeScript pero envolver en RPC que recibe payment payload — evitar dos round-trips sin transacción.

Si se mantiene `confirmPaymentService` en TS: **obligatorio** que deduct + payment + order update compartan transacción (RPC única o `supabase.rpc` atómica). No marcar `paid` si deduct falló.

## Contrato RPC

### `commerce.deduct_stock_for_order(p_order_id uuid)`

| Aspecto      | Detalle                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| Seguridad    | `SECURITY DEFINER`; `GRANT EXECUTE TO authenticated`                    |
| RLS          | Verifica `core.is_staff()` o solo invocable desde `confirm_payment_*`   |
| Idempotencia | Si orden ya `paid` → no-op o error `ALREADY_PAID` (elegir y testear)    |
| Errores      | `INSUFFICIENT_STOCK` (detail: product sku o container sku), `NOT_FOUND` |

### Input shopping_cart (lectura)

Desde `orders.shopping_cart` JSONB — mismos tipos que `@de-tin-marin/shared/order-cart`:

```typescript
// product line
{ type: "product", productId, quantity, ... }

// bundle line (S1E+)
{ type: "bundle", quantity, container?: { containerId, ... }, components: [{ productId, totalQuantity, ... }] }

// legacy
{ type: "bundle", quantity, serviceFee?, components: [...] }  // sin container → skip envase
```

## Boundaries y DTOs

| Boundary          | Cambio                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| `confirmPayment`  | Puede retornar `{ ok: false, error: 'INSUFFICIENT_STOCK', details?: { sku, kind } }` |
| `getOrder`        | Opcional: `stockCheck: { ok: boolean; shortages?: [...] }` vía `checkOrderStock`     |
| `checkOrderStock` | Server helper / action interna — no expuesta a cliente final v1                      |

## Tablas y RLS

| Objeto                                                     | ¿Nueva? | pgTAP                                       |
| ---------------------------------------------------------- | ------- | ------------------------------------------- |
| `commerce.deduct_stock_for_order`                          | sí      | `supabase/tests/commerce__deduct_stock.sql` |
| `commerce.confirm_payment_with_stock_deduct` (si Opción A) | sí      | mismo archivo                               |

Sin tablas nuevas. Mutaciones solo vía RPC staff (no UPDATE directo stock desde cliente).

## Rules que aplican

- Reglas **4, 15, 16, 18, 20** ([business-rules.md](../../business-rules.md))
- DECISIONS **#25, #29, #30**
- [`inventory.md`](../../inventory.md) § Algoritmo de descuento
- [`rules/30-rls-and-postgres.md`](../../rules/30-rls-and-postgres.md)

## Orden de implementación

1. Este brief aprobado
2. Vitest `checkOrderStock` en shared (TDD contra casos Regla 15)
3. Migración `00010` — funciones Postgres + grants → `supabase db push` → `pnpm gen:db-types`
4. pgTAP deduct + confirm atómico
5. Refactor `confirmPaymentService` → llamar RPC atómica
6. Admin order detail: warning stock + manejo error `INSUFFICIENT_STOCK` en confirm
7. Actualizar `inventory.md` brief link; `roadmap.md` § S2A
8. `pnpm check` + `pnpm build`

## Criterios de aceptación

- [ ] `supabase db push` aplica `00010` sin error
- [ ] pgTAP — producto simple: loose primero, luego abrir sealed (Lay’s 50 → pedido 25 → 2 tiras + 5 bolsas)
- [ ] pgTAP — bundle 3 sorpresas con 2 componentes: deduct correcto por producto
- [ ] pgTAP — bundle con `container`: `-3` en `stock_quantity` del envase
- [ ] pgTAP — legacy `serviceFee` sin `container`: deduct productos OK, envase omitido
- [ ] pgTAP — stock insuficiente producto **o** envase → excepción; orden sigue `pending_payment`
- [ ] pgTAP — confirmación pago + deduct atómico: no `paid` parcial
- [ ] Vitest — `checkOrderStock` coincide con escenarios pgTAP (mismos números)
- [ ] Admin: confirmar pago con stock OK → `paid` + stock actualizado en listados producto/envase
- [ ] Admin: confirmar con stock bajo → error claro, orden no `paid`
- [ ] `pnpm check` + `pnpm build` verdes

## Casos de prueba (referencia)

| Escenario          | Antes                                    | Cart                           | Después                           |
| ------------------ | ---------------------------------------- | ------------------------------ | --------------------------------- |
| Producto loose     | sealed=0, loose=30, ipp=10               | product qty=25                 | sealed=0, loose=5                 |
| Lay’s tiras        | sealed=5, loose=0, ipp=10                | product qty=25                 | sealed=2, loose=5                 |
| Bundle 2 sorpresas | Lay’s sealed=5, loose=0; envase stock=10 | bundle qty=2, 1 Lay’s/sorpresa | Lay’s sealed=4, loose=8; envase=8 |
| Sin envase legacy  | product OK                               | bundle qty=1, serviceFee only  | product deduct OK; envase N/A     |
| Fallo envase       | envase stock=0                           | bundle qty=1 con container     | ROLLBACK; orden pending           |

## Preguntas abiertas

- **Opción A vs B transacción:** ¿RPC única `confirm_payment_with_stock_deduct` o deduct separado? → **Recomendado A** para atomicidad sin confiar en múltiples calls TS.
- **Idempotencia:** re-confirmar orden ya `paid` → **error `ALREADY_CONFIRMED`** (consistente con S2C hoy).
- **Pre-check UI:** ¿bloquear botón confirmar si `checkOrderStock` falla? → **v1:** warning + permitir intento (race posible); deduct RPC es la barrera final.

## Depends on

- [database.md](../../database.md) § products stock, surprise_containers, orders
- [inventory.md](../../inventory.md)
- [S1D/01-products-packages-stock.md](../S1D/01-products-packages-stock.md)
- [S1E/01-surprise-containers-delivery.md](../S1E/01-surprise-containers-delivery.md)
- [S2C/01-payments-shipping.md](../S2C/01-payments-shipping.md)

## Bloquea

- **S3A** — ecommerce checkout necesita stock confiable al pagar
- **S3B** — operaciones admin end-to-end con inventario real
