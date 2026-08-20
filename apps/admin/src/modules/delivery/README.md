# Delivery — módulo admin

Zonas de delivery Piura y **puntos de recojo** (S1E + S4-08).

Canónico: [`docs/database.md`](../../../../docs/database.md) § `pricing.delivery_*`
y `pricing.pickup_points` · Reglas 19 y 30 · DECISIONS #40 ·
[`docs/stages/S4/08-pickup-points.md`](../../../../docs/stages/S4/08-pickup-points.md).

## Ruta

- `/delivery` — pestañas **Delivery** y **Puntos de recojo**.

| Pestaña          | Container                   | Qué configura                                             |
| ---------------- | --------------------------- | --------------------------------------------------------- |
| Delivery         | `DeliverySettingsContainer` | Zonas, `fallback_fee`, toggles delivery / pickup / puntos |
| Puntos de recojo | `PickupPointsContainer`     | CRUD de `pricing.pickup_points` + mapa                    |

`pickup_enabled` = recojo **en tienda** (órdenes admin `method: pickup`).
`pickup_points_enabled` = kill switch global de **puntos externos** en
ecommerce. No son lo mismo.

## Puntos de recojo

Actions staff (`requireStaff`):

| Action                    | Service                           |
| ------------------------- | --------------------------------- |
| `listPickupPointsAction`  | lista todos (activos e inactivos) |
| `upsertPickupPointAction` | create/update + Zod               |
| `deletePickupPointAction` | delete físico                     |

Campos: `name` (único), `lat`/`lng`, `fee >= 0`, `isActive`, `sortOrder`.
El mapa se carga con `next/dynamic` (`pickup-point-map.dynamic.tsx`).

Editar o borrar un punto **no** reescribe `orders.fulfillment.pickupPoint`
histórico.

## Fee

`resolveDeliveryFeeService` usa `@de-tin-marin/shared/delivery-fee`:

- `pickup` → 0
- `pickup_point` → fee del punto **activo** (si no hay match → 0 en helper
  admin; checkout usa `covered: false`)
- `delivery` → zona o `fallback_fee`
