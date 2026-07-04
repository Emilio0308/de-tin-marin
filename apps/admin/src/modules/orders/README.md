# Orders — módulo admin

Órdenes manuales con **Order shopping cart** congelado en JSONB.

Briefs: [S2B](../../../docs/stages/S2B/01-orders.md) · [S2C](../../../docs/stages/S2C/01-payments-shipping.md) · [orders.md](../../../docs/orders.md)

## Capas

```text
actions/ → services/ → repositories/ → Supabase schema commerce
```

## Server Actions

| Action                        | Service                        | Descripción                      |
| ----------------------------- | ------------------------------ | -------------------------------- |
| `listOrdersAction`            | `listOrdersService`            | Listado                          |
| `getOrderAction`              | `getOrderService`              | Detalle + pagos + envío          |
| `createOrderAction`           | `createOrderService`           | Crear → `pending_payment`        |
| `cancelOrderAction`           | `cancelOrderService`           | Cancelar desde `pending_payment` |
| `confirmPaymentAction`        | `confirmPaymentService`        | Pago manual → `paid` (S2C)       |
| `refundPaymentAction`         | `refundPaymentService`         | Reembolso payment (S2C)          |
| `transitionOrderStatusAction` | `transitionOrderStatusService` | Avance logístico post-pago       |
| `upsertShipmentAction`        | `upsertShipmentService`        | Envío 1:1 por orden (S2C)        |

## Services

- `order.service.ts` — carrito congelado, transiciones
- `payment.service.ts` — confirmar / reembolsar pago
- `shipment.service.ts` — upsert envío

## Repositories

- `order.repository.ts`
- `payment.repository.ts`
- `shipment.repository.ts`

## Rutas

| Ruta           | Container                |
| -------------- | ------------------------ |
| `/orders`      | `order-list.container`   |
| `/orders/new`  | `order-form.container`   |
| `/orders/[id]` | `order-detail.container` |

## Validaciones

`@de-tin-marin/validations/order` · `payment` · `shipment`
