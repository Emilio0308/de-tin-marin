# Orders — módulo admin

Órdenes manuales con **Order shopping cart** congelado en JSONB.

Brief: [S2B](../../../docs/stages/S2B/01-orders.md) · Dominio: [orders.md](../../../docs/orders.md)

## Capas

```text
actions/ → services/ → repositories/ → Supabase schema commerce
```

## Server Actions

| Action              | Service              | Descripción                      |
| ------------------- | -------------------- | -------------------------------- |
| `listOrdersAction`  | `listOrdersService`  | Listado                          |
| `getOrderAction`    | `getOrderService`    | Detalle                          |
| `createOrderAction` | `createOrderService` | Crear → `pending_payment`        |
| `cancelOrderAction` | `cancelOrderService` | Cancelar desde `pending_payment` |

## Services

- `order.service.ts` — congela carrito vía `@de-tin-marin/shared/order-cart`

## Repositories

- `order.repository.ts`

## Rutas

| Ruta           | Container                |
| -------------- | ------------------------ |
| `/orders`      | `order-list.container`   |
| `/orders/new`  | `order-form.container`   |
| `/orders/[id]` | `order-detail.container` |

## Validaciones

`@de-tin-marin/validations/order`
