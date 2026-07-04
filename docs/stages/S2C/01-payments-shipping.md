# S2C · Payments manual + Shipping

|                |                                                                         |
| -------------- | ----------------------------------------------------------------------- |
| **Etapa**      | S2C — Payments manual + Shipping ([roadmap.md](../../roadmap.md) § S2C) |
| **Owner**      | Equipo De Tin Marín                                                     |
| **App(s)**     | `packages/validations`, `apps/admin`                                    |
| **Schemas**    | `commerce`                                                              |
| **Depende de** | [S2B/01-orders.md](../S2B/01-orders.md)                                 |
| **Estado**     | done                                                                    |

## Contexto (leer esto, no todo docs/)

- S2B ✅ — `commerce.orders` con `shopping_cart` congelado; admin crea/lista/detalle/cancela; transición a `paid` **bloqueada** (`PAYMENT_CONFIRMATION_REQUIRED`).
- **Regla 17** — confirmar pago manual: insertar `commerce.payments` (`confirmed`) → orden `paid` + `payment_status = confirmed`. **No** `paid` sin fila en `payments`.
- **Regla 18** — reembolso manual: `payments.status = refunded`; reversión de stock **manual** en admin (v1).
- **DECISIONS #8** — sin pasarela v1; `method = internal`.
- **DECISIONS #25** — deduct stock al `paid` → **S2A**, no enganchar en S2C.
- Estados post-pago: `paid → preparing → ready → delivered → completed` ([`orders.md`](../../orders.md)).

## Objetivo

Un operador staff puede confirmar el pago manual de una orden (`pending_payment` → `paid`), registrar/reembolsar pagos en `commerce.payments`, gestionar el envío en `commerce.shipments`, y avanzar el ciclo logístico de la orden hasta `completed`.

## Scope IN

- Migración `00007_commerce_payments_shipments.sql` + pgTAP RLS staff + grants
- `@de-tin-marin/validations`: `confirmPaymentInputSchema`, `refundPaymentInputSchema`, `shipmentInputSchema`, DTOs allowlist
- Admin actions/services/repositories:
  - `confirmPayment` — Regla 17
  - `refundPayment` — Regla 18 (v1 básico)
  - `transitionOrderStatus` — habilitar `paid`, `preparing`, `ready`, `delivered`, `completed` (vía `confirmPayment` para `paid`)
  - `getShipment` / `upsertShipment` — 1 envío por orden
- UI detalle orden `/orders/[id]`: panel pago, panel envío, acciones de estado
- i18n admin (`messages/es.json`) + tokens design system ([`rules/88-ui-design-i18n.md`](../../rules/88-ui-design-i18n.md))
- Docs: [`database.md`](../../database.md) § payments/shipments, [`orders.md`](../../orders.md) flujo pago

## Scope OUT (traps)

- **NO `deduct_stock_for_order`** → S2A → _Regla 15_
- **NO validación de stock pre-pago** → S2A
- **NO pasarela / webhooks / `external_payment_id`** → DECISIONS #8
- **NO checkout ecommerce** → S3A
- **NO notificaciones email** → S4
- **NO `index.ts` barrels**

## Tablas y RLS

Convenciones: PK `id uuid`, `created_at`, `updated_at`, `currency_code default 'PEN'` donde aplique dinero.

### `commerce.payments` (nueva)

| Columna         | Tipo          | Notas                                             |
| --------------- | ------------- | ------------------------------------------------- |
| `id`            | uuid PK       | `gen_random_uuid()`                               |
| `order_id`      | uuid FK       | → `commerce.orders`, ON DELETE RESTRICT           |
| `amount`        | numeric(12,2) | Debe coincidir con `orders.total` en confirmación |
| `currency_code` | text          | default `'PEN'`                                   |
| `status`        | text          | `pending` \| `confirmed` \| `refunded`            |
| `method`        | text          | v1 fijo: `internal`                               |
| `confirmed_by`  | uuid          | staff (`auth.users` / perfil staff)               |
| `notes`         | text          | Opcional — referencia Yape, transferencia, etc.   |
| `confirmed_at`  | timestamptz   | Set al confirmar                                  |
| `created_at`    | timestamptz   |                                                   |
| `updated_at`    | timestamptz   |                                                   |

Índice: `payments_order_id_idx`. Múltiples filas por orden permitidas (historial reembolsos); la confirmación v1 crea una fila `confirmed`.

### `commerce.shipments` (nueva)

| Columna           | Tipo        | Notas                                           |
| ----------------- | ----------- | ----------------------------------------------- |
| `id`              | uuid PK     |                                                 |
| `order_id`        | uuid FK     | → `commerce.orders`, **UNIQUE** (1:1 con orden) |
| `status`          | text        | `pending` \| `shipped` \| `delivered`           |
| `tracking_number` | text        | Opcional                                        |
| `carrier`         | text        | Opcional — ej. Olva, Shalom, recojo tienda      |
| `shipped_at`      | timestamptz | Set al pasar a `shipped`                        |
| `delivered_at`    | timestamptz | Set al pasar a `delivered`                      |
| `notes`           | text        | Opcional                                        |
| `created_at`      | timestamptz |                                                 |
| `updated_at`      | timestamptz |                                                 |

Índice: `shipments_order_id_idx` (unique). Dirección de entrega sigue en `orders.fulfillment` — **no duplicar** en shipments.

### Alter `commerce.orders` (opcional v1)

- Al confirmar pago, opcionalmente append a `payment_methods` jsonb:

```json
[{ "type": "internal", "reference": "Yape 999...", "confirmedAt": "..." }]
```

Estructura flexible; validación mínima en service.

| Tabla (schema)       | ¿Nueva? | Ops                        | Política (prosa)       | pgTAP                                       |
| -------------------- | ------- | -------------------------- | ---------------------- | ------------------------------------------- |
| `commerce.payments`  | sí      | SELECT/INSERT/UPDATE staff | Solo `core.is_staff()` | `supabase/tests/commerce__payments.sql`     |
| `commerce.shipments` | sí      | SELECT/INSERT/UPDATE staff | Solo `core.is_staff()` | `supabase/tests/commerce__shipments.sql`    |
| `commerce.orders`    | alter   | UPDATE (status, payment)   | Sin cambio RLS base    | (cubierto en tests de transición existente) |

Grants: `GRANT SELECT, INSERT, UPDATE ON commerce.payments, commerce.shipments TO authenticated` (+ `USAGE ON SCHEMA commerce` si falta).

## Boundaries y DTOs

| Boundary                | Tipo          | Input (Zod)                  | Output DTO (allowlist)                                       |
| ----------------------- | ------------- | ---------------------------- | ------------------------------------------------------------ |
| `confirmPayment`        | Server Action | `confirmPaymentInputSchema`  | `{ orderId, paymentId, status: 'paid' }`                     |
| `refundPayment`         | Server Action | `refundPaymentInputSchema`   | `{ paymentId, status: 'refunded' }`                          |
| `transitionOrderStatus` | Server Action | `transitionOrderStatusInput` | `{ id, status }` — **sin** `paid` directo (solo vía confirm) |
| `getShipment`           | Server Action | `orderId` uuid               | `ShipmentDTO \| null`                                        |
| `upsertShipment`        | Server Action | `upsertShipmentInputSchema`  | `ShipmentDTO`                                                |

`confirmPaymentInput`: `{ orderId, notes?, paymentReference? }` — `amount` tomado de `orders.total` en service (no confiar en cliente).

`ShipmentDTO`: `{ id, orderId, status, trackingNumber, carrier, shippedAt, deliveredAt, notes }`.

`PaymentSummaryDTO` (en detalle orden): `{ id, amount, status, method, notes, confirmedAt, confirmedBy }`.

## Rules que aplican

- Invariantes **11, 17, 18** ([CLAUDE.md](../../../CLAUDE.md))
- [`rules/30-rls-and-postgres.md`](../../rules/30-rls-and-postgres.md)
- [`rules/40-validation-and-boundaries.md`](../../rules/40-validation-and-boundaries.md)
- [`rules/88-ui-design-i18n.md`](../../rules/88-ui-design-i18n.md)
- [`orders.md`](../../orders.md), [`business-rules.md`](../../business-rules.md) § Payments

## Orden de implementación

1. Migración `00007` + pgTAP → `pnpm gen:db-types`
2. Validations Zod + Vitest
3. Repositories `payment.repository.ts`, `shipment.repository.ts`
4. Services: `confirmPaymentService` (transacción: insert payment + update order), ampliar `transitionOrderStatusService`
5. Actions + ampliar `getOrder` con pagos y shipment embebidos
6. UI detalle orden (pago, envío, botones estado)
7. i18n + tests render presentacionales
8. `pnpm check` + `pnpm build`

## Criterios de aceptación

- [ ] `supabase db push` aplica `00007` sin error
- [ ] pgTAP — `commerce__payments.sql`, `commerce__shipments.sql`: RLS staff-only
- [ ] Vitest — `packages/validations/src/payment.test.ts`: confirm/refund inputs
- [ ] Vitest — `packages/validations/src/shipment.test.ts`: status enum, upsert
- [ ] Confirmar pago en orden `pending_payment` → `paid`, fila `payments.status = confirmed`, `payment_status = confirmed`
- [ ] Intento `transitionOrderStatus` directo a `paid` sigue fallando con `PAYMENT_CONFIRMATION_REQUIRED`
- [ ] Operador avanza `paid → preparing → ready → delivered → completed`
- [ ] Upsert shipment: tracking + carrier; estados `pending/shipped/delivered`
- [ ] Reembolso marca payment `refunded` (orden según política v1 documentada en service)
- [ ] Admin UI: textos i18n, responsive, tokens (sin hex sueltos)
- [ ] `pnpm check` + `pnpm build` verdes

## Preguntas abiertas

- Ninguna — esquema `shipments` y flujo manual acordados en este brief.

## Depends on

- [database.md](../../database.md) § `commerce.payments`, `commerce.shipments`
- [orders.md](../../orders.md) § Pago manual, estados
- [DECISIONS.md](../../DECISIONS.md) #8, #25
- [S2B/01-orders.md](../S2B/01-orders.md)
