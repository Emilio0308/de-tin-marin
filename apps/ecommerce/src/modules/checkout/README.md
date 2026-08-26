# Módulo `checkout`

Formulario de checkout, mapa de entrega y creación de orden `pending_payment`
(S3A-3 + S4-08 + S4-11).

Lee flags desde `@/config/store` (`storeFeatures`). El recojo **en tienda**
sigue oculto (`pickupEnabled: false`). Los **puntos de recojo** dependen de
`pricing.delivery_settings.pickup_points_enabled`. **Courier** depende de
`courier_enabled` y destinos activos.

Reglas de fetching: [`docs/rules/50-data-fetching-cache-ssr.md`](../../../../docs/rules/50-data-fetching-cache-ssr.md) · DECISIONS #32.
Canónico fulfillment: Reglas 19/30/31 · DECISIONS #40, #43 ·
[`docs/stages/S4/08-pickup-points.md`](../../../../docs/stages/S4/08-pickup-points.md) ·
[`docs/stages/S4/11-courier-shipping.md`](../../../../docs/stages/S4/11-courier-shipping.md).

## Fulfillment guest

| Método         | UI                                              | Persistencia                                         |
| -------------- | ----------------------------------------------- | ---------------------------------------------------- |
| `delivery`     | Dirección + mapa Piura                          | `deliveryAddress` + `metadata.mapPin`                |
| `pickup_point` | Select + mapa del punto (si hay puntos activos) | Snapshot `pickupPoint` rehidratado en el service     |
| `courier`      | Dept/provincia + DNI/nombre/dirección agencia   | Snapshot `courier` rehidratado; `shipping_total = 0` |

`listCheckoutPickupPointsAction` → `[]` si el kill switch está off o no hay
activos → el presentational oculta la opción. `listCheckoutCourierDestinationsAction`
→ `[]` si `courier_enabled` off o sin provincias habilitadas. Fee vía
`resolveCheckoutFulfillmentFee` (`queryKeys.checkout.deliveryFee` incluye
método, `pickupPointId` o `departmentId` + `provinceSlug`).

Al submit, `createGuestOrderService` rehidrata fulfillment desde DB (punto o
destino courier). Errores: `PICKUP_POINT_*`, `OUT_OF_COVERAGE`,
`SHIPPING_FEE_MISMATCH`. Courier exige `shippingTotal === 0`. El RPC
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
