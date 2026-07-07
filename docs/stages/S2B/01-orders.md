# S2B · Orders (admin + shopping cart congelado)

|                |                                                                                     |
| -------------- | ----------------------------------------------------------------------------------- |
| **Etapa**      | S2B — Orders ([roadmap.md](../../roadmap.md) § S2B)                                 |
| **Owner**      | Equipo De Tin Marín                                                                 |
| **App(s)**     | `packages/shared`, `packages/validations`, `apps/admin`                             |
| **Schemas**    | `commerce`                                                                          |
| **Depende de** | [S1C/01-pricing-campaigns-foundation.md](../S1C/01-pricing-campaigns-foundation.md) |
| **Estado**     | done                                                                                |

## Contexto (leer esto, no todo docs/)

- S1A ✅ — productos con `prices`, stock; S1B ✅ — bundles plantilla; S1C ✅ — `finalPrice` en backend.
- **S1D** (posterior) refactoriza stock a sealed/loose y añade `prices.unit` — S2B no requiere cambios en `shopping_cart`.
- **Order shopping cart** — detalle congelado en `commerce.orders.shopping_cart` JSONB (DECISIONS #26). Sin tablas de líneas.
- Toda orden nace en **`pending_payment`**; estados: `pending_payment → paid → preparing → ready → delivered → completed` (+ `cancelled`).
- **Regla 13** — al crear orden se congela carrito + totales; **Regla 16** — no recalcular post-checkout.
- **S2C** — confirmar pago → `paid`; **S2A** — deduct stock al `paid`. **Fuera de S2B.**

## Objetivo

Un operador staff puede crear órdenes manuales en admin con productos y sorpresas personalizadas, ver listado/detalle, y cancelar órdenes en `pending_payment`; el carrito queda congelado en JSONB.

## Scope IN

- Migración `00006_commerce_orders.sql` + pgTAP RLS staff
- `@de-tin-marin/shared/order-cart`: `buildShoppingCart`, `computeOrderTotals`, `canTransitionOrderStatus`
- `@de-tin-marin/validations/order`: schemas input/DTO + Vitest
- Admin: `createOrder`, `listOrders`, `getOrder`, `cancelOrder`, `transitionOrderStatus` (solo `cancelled` desde `pending_payment` en v1)
- UI: `/orders` listado, `/orders/new` formulario, `/orders/[id]` detalle
- Nav admin + i18n mínimo

## Scope OUT (traps)

- **NO confirmar pago / `paid`** → S2C → _Regla 17_
- **NO `deduct_stock_for_order`** → S2A → _Regla 15_
- **NO `commerce.payments` / `shipments`** → S2C
- **NO checkout ecommerce / carrito cliente** → S3A
- **NO `crm.customers` / login** → S4; guest snapshot en `contact` jsonb
- **NO validación de stock** al crear → S2A
- **NO `index.ts` barrels**

## Tablas y RLS

| Tabla (schema)    | ¿Nueva? | Ops                        | Política (prosa)       | pgTAP                                 |
| ----------------- | ------- | -------------------------- | ---------------------- | ------------------------------------- |
| `commerce.orders` | sí      | SELECT/INSERT/UPDATE staff | Solo `core.is_staff()` | `supabase/tests/commerce__orders.sql` |

Grants: `GRANT USAGE ON SCHEMA commerce`; `GRANT SELECT, INSERT, UPDATE ON commerce.orders TO authenticated`.

## Boundaries y DTOs

| Boundary                | Tipo          | Input (Zod)              | Output DTO (allowlist)                                |
| ----------------------- | ------------- | ------------------------ | ----------------------------------------------------- |
| `createOrder`           | Server Action | `createOrderInputSchema` | `{ id, orderNumber }`                                 |
| `listOrders`            | Server Action | —                        | `OrderListItem[]`                                     |
| `getOrder`              | Server Action | `id` uuid                | `OrderDetailDTO`                                      |
| `cancelOrder`           | Server Action | `id` uuid                | `{ id, status }`                                      |
| `transitionOrderStatus` | Server Action | id + status              | Solo `cancelled` desde `pending_payment`; resto → S2C |

`OrderDetailDTO`: `orderId`, `customer`, `fulfillment`, `shoppingCart`, `status`, `paymentStatus`, `paymentMethods`, totales, `currencyCode`, `metadata`, `createdAt`.

## Rules que aplican

- Invariantes **11, 13, 14, 16** ([CLAUDE.md](../../../CLAUDE.md))
- [`rules/30-rls-and-postgres.md`](../../rules/30-rls-and-postgres.md)
- [`rules/40-validation-and-boundaries.md`](../../rules/40-validation-and-boundaries.md)
- [`orders.md`](../../orders.md)

## Orden de implementación

1. Migración + pgTAP → `pnpm gen:db-types`
2. `order-cart` + validations + tests
3. Repository → service → actions
4. UI list / form / detail
5. e2e smoke + `pnpm check` + `pnpm build`

## Criterios de aceptación

- [ ] `supabase db push` aplica `00006` sin error
- [ ] Vitest — `packages/shared/src/order-cart.test.ts`: totales producto+bundle, transiciones
- [ ] Vitest — `packages/validations/src/order.test.ts`: contact, fulfillment, lines
- [ ] pgTAP — `commerce__orders.sql`: RLS staff-only insert
- [ ] Admin crea orden con sorpresa personalizada; detalle muestra `shoppingCart` congelado
- [ ] Cancelar orden `pending_payment` → `cancelled`; intento `paid` rechazado
- [ ] Playwright — `apps/admin/e2e/orders-smoke.spec.ts`: redirect login
- [ ] `pnpm check` + `pnpm build` verdes

## Preguntas abiertas

- Ninguna — guest `contact` + `fulfillment` en jsonb; pagos y avance post-`paid` en S2C.

## Depends on

- [orders.md](../../orders.md), [database.md](../../database.md) § `commerce.orders`
- DECISIONS #17, #25, #26
