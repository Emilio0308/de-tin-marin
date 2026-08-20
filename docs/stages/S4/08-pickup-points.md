# S4-08 · Puntos de recojo

|                |                                                    |
| -------------- | -------------------------------------------------- |
| **Etapa**      | S4 — Completitud / fulfillment                     |
| **Owner**      | Equipo De Tin Marín                                |
| **App(s)**     | `apps/admin`, `apps/ecommerce`                     |
| **Schemas**    | `pricing`, `commerce`                              |
| **Depende de** | S1E delivery ✅, S2B órdenes ✅, S3A-3 checkout ✅ |
| **Estado**     | done                                               |

## Contexto

- S1E modeló `pickup` = recojo en tienda (`shipping_total = 0`) y lo dejó
  desactivado en ecommerce (`storeFeatures.pickupEnabled = false`).
- El negocio necesita **puntos de recojo externos** (mall, centro comercial)
  con ubicación y **tarifa propia**, distintos del recojo en tienda.
- Checkout guest ya exigía cobertura Piura para `delivery`; el RPC
  `commerce.insert_guest_order` solo aceptaba `method = delivery`.

## Objetivo

Staff cataloga puntos de recojo (nombre, mapa, fee, activo). En checkout
guest el cliente elige `delivery` o `pickup_point`. Al crear la orden se
congela el snapshot del punto y el `shipping_total`. Admin puede seguir
usando `pickup` (tienda) en órdenes manuales.

## Scope IN

- Tabla `pricing.pickup_points` + columna
  `pricing.delivery_settings.pickup_points_enabled`
- Migración `00028_pickup_points.sql` (incluye rewrite de
  `commerce.insert_guest_order` para `delivery` \| `pickup_point`) + pgTAP
- Shared: `resolvePickupPointFee` / `resolveCheckoutFulfillmentFee` con
  `method` y `pickupPointId`
- Validaciones: `@de-tin-marin/validations/pickup-point` + XOR en
  `orderFulfillmentSchema` / `createGuestOrderInputSchema`
- Admin `/delivery`: pestaña **Puntos de recojo** (CRUD + mapa Leaflet)
  y toggle `pickup_points_enabled` en ajustes de delivery
- Admin order-form: método `pickup_point` + selector; detalle muestra
  nombre y pin del snapshot
- Ecommerce checkout: opción visible solo si hay puntos activos **y** el
  kill switch está on; fee fresco; create rehidrata snapshot desde DB
- Confirmación / lookup guest + emails: título y resumen del punto

## Scope OUT (traps)

- **NO** reutilizar `pickup` para malls → _confundir tienda vs punto externo_
  (DECISIONS #40)
- **NO** geocoding de pago ni direcciones de texto en el punto → _scope_
- **NO** `pickup` en ecommerce/guest ni en `insert_guest_order` → _matriz_
- **NO** confiar en el snapshot de fee que manda el cliente → _rehidratar
  desde `pricing.pickup_points`_
- **NO** borrar el snapshot histórico al editar/eliminar un punto
- **NO** mezclar `deliveryAddress` y `pickupPoint` en el mismo fulfillment

## Tablas y RLS

| Tabla / objeto                | ¿Nueva? | Ops                                | Política                            | Test                         |
| ----------------------------- | ------- | ---------------------------------- | ----------------------------------- | ---------------------------- |
| `pricing.pickup_points`       | sí      | SELECT público activos; CRUD staff | `is_active`; staff ve inactivos     | `core`/pricing pickup tests  |
| `pricing.delivery_settings`   | alter   | `pickup_points_enabled`            | SELECT público; UPDATE staff        | existente + columna          |
| `commerce.insert_guest_order` | alter   | `delivery` XOR `pickup_point`      | SECURITY DEFINER; guest no `pickup` | `commerce__guest_orders.sql` |

Checks: `fee >= 0`, lat/lng bounds, `name` unique.

## Boundaries y DTOs

| Boundary                           | Tipo          | Input                                        | Output                           |
| ---------------------------------- | ------------- | -------------------------------------------- | -------------------------------- |
| `listPickupPointsAction`           | Server Action | — (staff)                                    | puntos incl. inactivos           |
| `upsertPickupPointAction`          | Server Action | `pickupPointInputSchema`                     | `{ id }`                         |
| `deletePickupPointAction`          | Server Action | `id`                                         | `{ ok }`                         |
| `listCheckoutPickupPointsAction`   | Server Action | —                                            | activos; `[]` si kill switch off |
| `resolveCheckoutFulfillmentFee`    | Server Action | method + district/mapPin **o** pickupPointId | `{ fee, covered }`               |
| Snapshot `fulfillment.pickupPoint` | JSONB orden   | —                                            | `{ id, name, lat, lng, fee }`    |

## Rules que aplican

- Reglas **19**, **30**
- DECISIONS **#32**, **#40**
- Invariantes: 3, 8, 13, 16

## Criterios de aceptación

- [x] Staff CRUD puntos en `/delivery` (mapa, fee, activo)
- [x] Kill switch oculta puntos en checkout (`list` vacío)
- [x] Guest `pickup_point`: sin dirección ni mapPin; fee = punto activo
- [x] Guest `delivery`: sin `pickupPoint`; cobertura distrito/bbox Piura
- [x] Create rehidrata snapshot; mismatch de fee → `SHIPPING_FEE_MISMATCH`
- [x] Punto inactivo/inexistente → `PICKUP_POINT_INACTIVE` / `NOT_FOUND`
- [x] Admin order-form: `delivery` \| `pickup` \| `pickup_point`
- [x] RPC guest rechaza `pickup` y XOR inválido
- [x] Vitest shared + checkout helpers + pgTAP
- [x] `pnpm check` + `pnpm build` verdes

## Relacionado

- Delivery base: [`S1E/01-surprise-containers-delivery.md`](../S1E/01-surprise-containers-delivery.md)
- Checkout: [`S3A/03-cart-checkout.md`](../S3A/03-cart-checkout.md)
