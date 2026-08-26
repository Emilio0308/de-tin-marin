# Delivery — módulo admin

Zonas de delivery Piura, **puntos de recojo** (S4-08) y **envío courier**
(S4-11).

Canónico: [`docs/database.md`](../../../../docs/database.md) § `pricing.delivery_*`,
`pricing.pickup_points`, `pricing.courier_departments` · Reglas 19, 30 y 31 ·
DECISIONS #40, #43 ·
[`docs/stages/S4/08-pickup-points.md`](../../../../docs/stages/S4/08-pickup-points.md) ·
[`docs/stages/S4/11-courier-shipping.md`](../../../../docs/stages/S4/11-courier-shipping.md).

## Ruta

- `/delivery` — **Configuración global** (arriba) + pestañas por método debajo.

| Bloque            | Container                         | Qué configura                                                 |
| ----------------- | --------------------------------- | ------------------------------------------------------------- |
| Global (siempre)  | `DeliveryGlobalSettingsContainer` | Toggles pickup / puntos / delivery / courier + `fallback_fee` |
| Delivery          | `DeliverySettingsContainer`       | Distritos / zonas de entrega Piura                            |
| Puntos de recojo  | `PickupPointsContainer`           | CRUD de `pricing.pickup_points` + mapa                        |
| Envío por agencia | `CourierDestinationsContainer`    | Toggles dept + provincias JSON en `courier_departments`       |

`pickup_enabled` = recojo **en tienda** (órdenes admin `method: pickup`).
`pickup_points_enabled` = kill switch global de **puntos externos** en
ecommerce. `courier_enabled` = kill switch de **envío por agencia** en
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

## Envío courier (agencia)

Actions staff (`requireStaff`):

| Action                          | Service                                                   |
| ------------------------------- | --------------------------------------------------------- |
| `listCourierDepartmentsAction`  | lista dept + provincias JSON                              |
| `createCourierDepartmentAction` | alta dept con provincias del catálogo shared (por nombre) |
| `updateCourierDepartmentAction` | toggle `is_active` / reescribe `provinces[].enabled`      |

Provincias son **lista fija** (catálogo shared + seed); admin solo togglea
`enabled` (no edita nombres/slugs). Seed Piura dept. **excluye** provincia
`piura` (delivery local). Crear dept nuevo copia el set de provincias del
catálogo shared cuando el nombre coincide.

Checkout público: `listCheckoutCourierDestinationsService` filtra dept
activos con ≥1 provincia `enabled`; `[]` si `courier_enabled = false`.

## Fee

`resolveDeliveryFeeService` usa `@de-tin-marin/shared/delivery-fee` +
`resolveCourierCoverage`:

- `pickup` → 0
- `courier` → 0 (cobertura vía dept/provincia)
- `pickup_point` → fee del punto **activo** (si no hay match → 0 en helper
  admin; checkout usa `covered: false`)
- `delivery` → zona o `fallback_fee`
