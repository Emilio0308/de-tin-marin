# S4-09 · Cancelación atómica (refund + restock)

|                |                                                |
| -------------- | ---------------------------------------------- |
| **Etapa**      | S4 — Completitud / operaciones                 |
| **Owner**      | Equipo De Tin Marín                            |
| **App(s)**     | `apps/admin`, `supabase`                       |
| **Schemas**    | `commerce`, `catalog`                          |
| **Depende de** | S2A deduct ✅, S2B órdenes ✅, S2C payments ✅ |
| **Estado**     | done                                           |

## Contexto (leer esto, no todo docs/)

- Al confirmar pago, `commerce.confirm_payment_with_stock_deduct` descuenta
  stock de forma atómica (Regla 15 / S2A).
- Antes, el reembolso de payment era suelto y el restock **manual** (Regla 18
  histórica) → riesgo de payment `refunded` con orden abierta o restock doble.
- Cancel desde admin solo era fiable en `pending_payment` (sin deduct).
- DECISIONS **#41** / Regla **18** (actualizada): un solo punto de entrada
  `cancelOrder` → RPC atómica post-pago.

## Objetivo

Staff cancela con un solo control: si no hubo deduct, solo `cancelled`; si ya
hubo pago/deduct, en una transacción: payments → `refunded` + restock +
`cancelled`. Idempotente. Sin botón «Reembolsar» suelto.

## Scope IN

- Migración `00029_cancel_order_with_restock.sql`:
  - `commerce.restock_stock_for_order(order_id)` — misma agregación de demanda
    que el deduct; v1 devuelve a loose + normalize sealed
  - `commerce.cancel_order_with_restock(order_id, staff_user_id, notes?)` —
    staff-only, `FOR UPDATE`, ramas pending / post-pago / idempotente
- pgTAP `supabase/tests/commerce__cancel_order_restock.sql`
- Admin: `cancelOrderService` → RPC; `transition` a `cancelled` delega;
  bump catálogo si `restocked`; `refundPaymentService` → `USE_CANCEL_ORDER`
- UI detalle: Cancelar en `pending_payment` \| `paid` \| `preparing` \| `ready`;
  sin Reembolsar; copy post-pago
- Docs: Regla 18, inventory, orders, database, DECISIONS #41, README orders

## Scope OUT (traps)

- **NO** reembolso parcial / multi-payment selectivo → _estados parciales_
- **NO** reconstruir split exacto sealed/loose del deduct → v1 loose+normalize
- **NO** cancel desde `delivered` / `completed` → _INVALID_TRANSITION_
- **NO** cancel desde ecommerce guest → _fuera de alcance_
- **NO** ledger `inventory_movements` → v2
- **NO** renombrar estados `delivered` / copy pickup → otro ticket
- **NO** dejar `refundPayment` usable en UI → _USE_CANCEL_ORDER_

## Tablas y RLS

| Tabla / RPC                                | ¿Nueva? | Ops                   | Política                | Test                                 |
| ------------------------------------------ | ------- | --------------------- | ----------------------- | ------------------------------------ |
| `commerce.orders` / `payments`             | no      | UPDATE vía RPC        | staff (`core.is_staff`) | pgTAP                                |
| `catalog.products` / `surprise_containers` | no      | restock en RPC        | SECURITY DEFINER        | pgTAP                                |
| `cancel_order_with_restock`                | sí      | EXECUTE authenticated | revoke public           | `commerce__cancel_order_restock.sql` |

## Boundaries y DTOs

| Boundary                        | Tipo          | Input                                      | Output                                       |
| ------------------------------- | ------------- | ------------------------------------------ | -------------------------------------------- |
| `cancelOrderAction`             | Server Action | `orderId` (+ notes opcional)               | `{ id, status }`                             |
| RPC `cancel_order_with_restock` | Postgres      | `p_order_id`, `p_staff_user_id`, `p_notes` | `{ orderId, status, restocked, idempotent }` |
| `refundPaymentAction`           | Server Action | —                                          | error `USE_CANCEL_ORDER`                     |

## Rules que aplican

- Reglas **15** (deduct al paid), **18** (cancel atómico)
- DECISIONS **#41**
- Invariantes auth staff / ownership en actions

## Criterios de aceptación

- [x] Cancel `pending_payment` → `cancelled`; stock/payments intactos
- [x] Cancel `paid`/`preparing`/`ready` → payments `refunded` + restock + `cancelled` atómico
- [x] Segunda cancel → idempotente, sin doble restock
- [x] `delivered`/`completed` → rechazado
- [x] Admin: un control Cancelar; sin Reembolsar suelto
- [x] Vitest cancel service + order-detail; pgTAP restock/idempotencia

## Relacionado

- Deduct: [`S2A/01-stock-deduct-on-payment.md`](../S2A/01-stock-deduct-on-payment.md)
- Payments: [`S2C/01-payments-shipping.md`](../S2C/01-payments-shipping.md)
- Canónico: [`orders.md`](../../orders.md) · [`inventory.md`](../../inventory.md) · Regla 18
