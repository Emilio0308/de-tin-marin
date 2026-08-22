# Módulo `checkout`

Formulario de checkout, mapa de entrega y creación de orden `pending_payment`
(S3A-3 + S4-08).

Lee flags desde `@/config/store` (`storeFeatures`). El recojo **en tienda**
sigue oculto (`pickupEnabled: false`). Los **puntos de recojo** no usan ese
flag: dependen de `pricing.delivery_settings.pickup_points_enabled` y de que
existan puntos activos.

Reglas de fetching: [`docs/rules/50-data-fetching-cache-ssr.md`](../../../../docs/rules/50-data-fetching-cache-ssr.md) · DECISIONS #32.
Canónico fulfillment: Reglas 19/30 · DECISIONS #40 ·
[`docs/stages/S4/08-pickup-points.md`](../../../../docs/stages/S4/08-pickup-points.md).

## Fulfillment guest

| Método         | UI                                              | Persistencia                                     |
| -------------- | ----------------------------------------------- | ------------------------------------------------ |
| `delivery`     | Dirección + mapa Piura                          | `deliveryAddress` + `metadata.mapPin`            |
| `pickup_point` | Select + mapa del punto (si hay puntos activos) | Snapshot `pickupPoint` rehidratado en el service |

`listCheckoutPickupPointsAction` → `[]` si el kill switch está off o no hay
activos → el presentational oculta la opción. Fee vía
`resolveCheckoutFulfillmentFee` (`queryKeys.checkout.deliveryFee` incluye
método y `pickupPointId`).

Al submit, `createGuestOrderService` vuelve a leer el punto en DB (nombre,
coords, fee). Errores: `PICKUP_POINT_REQUIRED` / `NOT_FOUND` / `INACTIVE`,
`OUT_OF_COVERAGE`, `SHIPPING_FEE_MISMATCH`. El RPC
`insert_guest_order` rechaza `pickup` y XOR inválido.

## Validación del formulario (cliente)

- **On blur:** cada campo valida solo ese input (Zod en
  `checkout-form.helpers`) y muestra error inline.
- **Botón “Confirmar pedido”:** queda habilitado salvo mientras
  `isSubmitting`. No se deshabilita por cobertura pendiente, fee loading ni
  pricing preview.
- **Al submit:** revalida el schema completo; si falta o es inválido un
  campo → scroll/focus al primero + toast Sonner
  (`Completa/Revisa el campo "…" en la sección de …`). Sin cobertura /
  fee o precios aún pendientes → toast (no create silencioso).

## Validación de carrito al submit

No hay polling de stock en checkout. Tras pasar el schema del form:

1. `validateGuestCheckoutCartAction` — precios vigentes + stock en una ida.
2. Si hay drift (`priceChanged` / `!stockOk`) → `dtm-cart-sync` + redirect `/carrito?sync=1`.
3. Si OK → `createGuestOrderAction` (revalida en servidor, incluido fulfillment).

Fee de fulfillment sigue con `freshQueryOptions`. Zonas y puntos usan query
keys propias.

## Email al crear orden

Tras el insert, `createGuestOrderService` **await**
`scheduleOrderCreatedNotification` (SMTP best-effort; Regla 28 / DECISIONS
#39). Fallo de correo no revierte la orden.
