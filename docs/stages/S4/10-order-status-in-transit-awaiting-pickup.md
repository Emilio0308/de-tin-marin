# S4-10 · Estados `in_transit` / `awaiting_pickup` + envío condicional

|                |                                                                  |
| -------------- | ---------------------------------------------------------------- |
| **Etapa**      | S4 — Completitud / logística                                     |
| **Owner**      | Equipo De Tin Marín                                              |
| **App(s)**     | `apps/admin`, `apps/ecommerce`, `supabase`                       |
| **Schemas**    | `commerce`                                                       |
| **Depende de** | S2C shipments ✅, S4-09 cancel atómico ✅, S4-08 pickup_point ✅ |
| **Estado**     | done                                                             |

## Contexto (leer esto, no todo docs/)

- Tras pago, el flujo era `paid → preparing → ready → delivered` sin distinguir
  recojo en tienda vs envío / punto de recojo.
- `delivered` debe significar que el **cliente ya tiene** el producto.
- `commerce.shipments` ya existía (S2C); el panel no debe mostrarse en
  `paid`/`preparing`.
- Cancel atómico (#41) debe seguir aplicando mientras el stock ya se deductó
  (incl. estados logísticos nuevos).

## Objetivo

Desde `ready`, el siguiente estado depende de `fulfillment.method`:
`pickup` → `awaiting_pickup`; `delivery` \| `pickup_point` → `in_transit`
(con carrier + tracking obligatorios). Luego `delivered` → `completed`.
(**S4-11 / #43** añade `courier` al mismo camino `in_transit`.)

## Scope IN

- Migración `00030_order_status_in_transit_awaiting_pickup.sql`:
  - CHECK `orders.status` + `awaiting_pickup` / `in_transit`
  - `cancel_order_with_restock` acepta esos estados
- Shared: `ORDER_STATUSES`, `nextLogisticStatus(method)`,
  `canTransitionOrderStatus(from, to, method)`
- Zod: `transitionOrderStatusInputSchema` + `shipment` required si
  `status === in_transit`
- Admin: transition service upsert shipment fail-fast antes del status;
  UI form inline en `ready→in_transit`; panel editable solo en `in_transit`;
  stepper/labels
- Ecommerce/guest: labels “En camino” / “Listo para recojo” + progress
- Docs: DECISIONS #42, Regla 14, `orders.md`, `database.md`, README orders
- Tests: Vitest matriz por method + transition sin shipment; pgTAP status/cancel

## Scope OUT (traps)

- **NO** estado “en el punto de recojo” aparte de `in_transit` → _scope_
- **NO** shipment obligatorio para `pickup` / `awaiting_pickup`
- **NO** panel envío en `paid` / `preparing` → _UX confusa_
- **NO** `ready → delivered` directo → _salta logística_
- **NO** cancel desde `delivered` / `completed`
- **NO** RPC única transition+shipment v1 (TS fail-fast aceptable; RPC futuro)
- **NO** tracking automático / webhooks courier

## Tablas y RLS

| Tabla / RPC                 | ¿Nueva?     | Ops                        | Política | Test                                    |
| --------------------------- | ----------- | -------------------------- | -------- | --------------------------------------- |
| `commerce.orders.status`    | alter CHECK | UPDATE staff               | staff    | pgTAP                                   |
| `commerce.shipments`        | no          | upsert al `in_transit`     | staff    | Vitest service                          |
| `cancel_order_with_restock` | alter       | cancel desde nuevos status | staff    | `commerce__order_status_in_transit.sql` |

## Boundaries y DTOs

| Boundary                          | Tipo          | Input                       | Output           |
| --------------------------------- | ------------- | --------------------------- | ---------------- |
| `transitionOrderStatusAction`     | Server Action | `{ id, status, shipment? }` | `{ id, status }` |
| `upsertShipmentAction`            | Server Action | carrier, tracking, notes    | shipment DTO     |
| Shared `canTransitionOrderStatus` | puro          | from, to, method?           | boolean          |

## Rules que aplican

- Regla **14** (transiciones + method)
- Regla **18** / DECISIONS **#41** (cancel ampliado)
- DECISIONS **#42**

## Criterios de aceptación

- [x] `ready` + `pickup` → solo `awaiting_pickup` (sin shipment)
- [x] `ready` + `delivery`/`pickup_point` → `in_transit` exige carrier+tracking
      (`courier` añadido en S4-11 / DECISIONS #43; misma regla)
- [x] Fallo upsert shipment → orden no cambia de status
- [x] `delivered` solo desde `awaiting_pickup` \| `in_transit`
- [x] Panel envío ausente en `paid`/`preparing`; editable en `in_transit`
- [x] Cancel desde `awaiting_pickup`/`in_transit` vía RPC atómica
- [x] Guest ve labels correctos

## Relacionado

- Cancel: [`09-cancel-atomic-restock.md`](09-cancel-atomic-restock.md)
- Pickup points: [`08-pickup-points.md`](08-pickup-points.md)
- Courier: [`11-courier-shipping.md`](11-courier-shipping.md) (mismo `in_transit`)
- Canónico: [`orders.md`](../../orders.md) · DECISIONS #42 / #43
