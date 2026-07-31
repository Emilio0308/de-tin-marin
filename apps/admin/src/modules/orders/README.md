# Orders — módulo admin

Órdenes manuales con **Order shopping cart** congelado en JSONB.

Briefs: [S2B](../../../docs/stages/S2B/01-orders.md) · [S2C](../../../docs/stages/S2C/01-payments-shipping.md) · [S1F](../../../docs/stages/S1F/01-catalog-packs.md) · [orders.md](../../../docs/orders.md)

## Capas

```text
actions/ → services/ → repositories/ → Supabase schema commerce
```

## Server Actions

| Action                         | Service                         | Descripción                                     |
| ------------------------------ | ------------------------------- | ----------------------------------------------- |
| `listOrdersAction`             | `listOrdersService`             | Listado completo (dashboard)                    |
| `listOrdersPageAction`         | `listOrdersPageService`         | Listado paginado (SQL `count` + `range`)        |
| `getOrderAction`               | `getOrderService`               | Detalle + pagos + envío                         |
| `createOrderAction`            | `createOrderService`            | Crear → `pending_payment`                       |
| `cancelOrderAction`            | `cancelOrderService`            | Cancelar desde `pending_payment`                |
| `confirmPaymentAction`         | `confirmPaymentService`         | Pago manual → `paid` (S2C)                      |
| `refundPaymentAction`          | `refundPaymentService`          | Reembolso payment (S2C)                         |
| `transitionOrderStatusAction`  | `transitionOrderStatusService`  | Avance logístico post-pago                      |
| `upsertShipmentAction`         | `upsertShipmentService`         | Envío 1:1 por orden (S2C)                       |
| `previewAdminBundleLineAction` | `previewAdminBundleLineService` | Preview línea sorpresa (mismo motor que create) |
| `previewOrderCartAction`       | `previewOrderCartService`       | Preview carrito / totales                       |

## Preview de precios (order-form)

Container: `order-form.container.tsx`

| Query                                                | Fresco                         | Motivo                                  |
| ---------------------------------------------------- | ------------------------------ | --------------------------------------- |
| `bundle-preview`                                     | Sí (`freshQueryOptions`)       | Total alineado con `createOrderService` |
| `cart-preview`                                       | Sí (`freshQueryOptions`)       | Totales de líneas al crear orden        |
| Catálogo auxiliar (productos, bundles, packs, zonas) | 15 min (default `QueryClient`) | Listados estables en sesión admin       |

## Services

- `order.service.ts` — carrito congelado, transiciones. `listOrdersPageService` valida `page`/`pageSize` con `@de-tin-marin/validations/admin-list` (orden `created_at desc`, sin filtros)
- `order-preview.service.ts` — preview bundle/cart (`buildOrderCartWithTotals`)
- `payment.service.ts` — confirmar / reembolsar pago (deduct atómico S2A)
- `shipment.service.ts` — upsert envío

Stock pre-confirm: `checkOrderStock` requiere `productType` en filas de producto (Regla 15 / DECISIONS #29). Líneas `type: pack` aportan `totalPackages` a presentaciones (Regla 24 / DECISIONS #33).

Tras confirmación de pago con deduct exitoso: `bumpCatalogVersionSafe` (stock cambió → invalidar listados tienda).

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

`@de-tin-marin/validations/order` · `payment` · `shipment` · **`admin-list`** (`listOrdersPageAction`)

Paginación `/orders`: mismos patrones que catálogo — [S3B/01-admin-list-pagination.md](../../../docs/stages/S3B/01-admin-list-pagination.md).
