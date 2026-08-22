# Orders — módulo admin

Órdenes manuales con **Order shopping cart** congelado en JSONB.

Canónico: [`docs/orders.md`](../../../docs/orders.md) · reglas 13–18, 21, 24,
28 · DECISIONS #26, #27, #29, #31, #33, #39.

Briefs: [S2B](../../../docs/stages/S2B/01-orders.md) · [S2C](../../../docs/stages/S2C/01-payments-shipping.md) · [S1F](../../../docs/stages/S1F/01-catalog-packs.md)

## Capas

```text
actions/ → services/ → repositories/ → Supabase schema commerce
```

Helpers UI/validación (no service):

```text
helpers/order-form-validation.ts   — createOrderInputSchema + mensajes de campo
components/order-form/*.helpers.ts — dual qty, bounds pack/product, add-block
```

## Server Actions

| Action                         | Service                         | Descripción                                                        |
| ------------------------------ | ------------------------------- | ------------------------------------------------------------------ |
| `listOrdersPageAction`         | `listOrdersPageService`         | Listado paginado (SQL `count` + `range`); dashboard usa pageSize 5 |
| `getOrderAction`               | `getOrderService`               | Detalle + pagos + envío                                            |
| `createOrderAction`            | `createOrderService`            | Crear → `pending_payment`                                          |
| `cancelOrderAction`            | `cancelOrderService`            | Cancelar desde `pending_payment`                                   |
| `confirmPaymentAction`         | `confirmPaymentService`         | Pago manual → `paid` (S2C)                                         |
| `refundPaymentAction`          | `refundPaymentService`          | Reembolso payment (S2C)                                            |
| `transitionOrderStatusAction`  | `transitionOrderStatusService`  | Avance logístico post-pago                                         |
| `upsertShipmentAction`         | `upsertShipmentService`         | Envío 1:1 por orden (S2C)                                          |
| `previewAdminBundleLineAction` | `previewAdminBundleLineService` | Preview línea sorpresa (mismo motor que create)                    |
| `previewOrderCartAction`       | `previewOrderCartService`       | Preview carrito / totales                                          |

## Crear orden (`/orders/new`)

Container: `order-form.container.tsx`.

Tras persistir, `createOrderService` **await** una notificación SMTP
best-effort para el correo operativo configurado y extras opcionales.
Una creación desde admin **no** envía correo al contacto de la orden. Fallos o
SMTP ausente se registran sin PII y no revierten la orden.

Fulfillment: `delivery` \| `pickup` (tienda) \| `pickup_point` (catálogo
S4-08). El detalle muestra nombre y mapa del snapshot `pickupPoint`.

### Catálogo (tabs)

| Uso                                 | Cómo                                                                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agregar producto / dulce a sorpresa | `ProductSearchPicker` → `listProductsPageAction`                                                                                                           |
| Listar combos / sorpresas (tabs)    | `listPacksPageAction` / `listBundlesPageAction`                                                                                                            |
| Armar sorpresa desde plantilla      | `getBundleAction` → solo ítems `isActive`; al agregar dulces, picker paginado                                                                              |
| Bloqueo al agregar producto / combo | `resolveProductAddBlockReason` / `resolvePackAddBlockReason` — `OUT_OF_STOCK` si stock/available = 0; packs listan `stockShortages` (productos bottleneck) |

### Líneas `type: product` — dual package + unit

Contrato snapshot: [`docs/orders.md`](../../../docs/orders.md) § Línea product · DECISIONS #27 · migración `00024`.

| UI                                                   | Regla                                        |
| ---------------------------------------------------- | -------------------------------------------- |
| Stepper **presentaciones**                           | `packageQuantity`                            |
| Stepper **unidades** (solo `product_type = package`) | `unitQuantity`                               |
| `product_type = unit`                                | Un solo stepper (presentación ≡ unidad base) |

**Payload create/preview:**

```typescript
{
  type: "product";
  productId;
  packageQuantity;
  unitQuantity;
}
// packageQuantity + unitQuantity >= 1
```

**Clamp (admin, Regla 21 excepción):**

- Shared: `clampProductDualQuantities` / `productLineNeedBaseUnits` (`@de-tin-marin/shared/product-purchase-limits`).
- `needBase = packageQuantity × items_per_package + unitQuantity`.
- Techo: `needBase ≤ stockTotalBaseUnits` (`mode: "admin"` — **no** aplica `purchase_min/max`).
- Al build servidor: `normalizeProductLineQuantities` (si `unitQuantity >= ipp` → convierte a paquetes).
- `lineTotal = packagePrice × packageQuantity + unitPrice × unitQuantity`.

Helpers locales: `order-form-product.helpers.ts`.

### Líneas pack / bundle

- Pack: qty de combos; composición BOM dual (`packageQuantity`/`unitQuantity` por componente) desplegable.
- Bundle: preview fresco; composición por componente; envase congelado (S1E).
  Los productos distintos deben estar entre
  `customizationMinProducts` y `customizationMaxProducts` de **esa**
  plantilla. El order-form recibe ambos límites con el DTO de bundle y los
  manda al preview; el servicio vuelve a cargar la plantilla y valida con
  `validateBundleCustomization`. No hay límites globales en órdenes.
  Cambiar la plantilla no modifica la composición ni los límites efectivos de
  un `shopping_cart` ya congelado.
- Bounds pack: `resolveOrderFormPackBounds` — techo = `availableQuantity` (salta min/max catálogo).

### Totales de cabecera

Fórmula:

```text
total = subtotal − discount_total + shipping_total + surcharge_total
```

Migración columna: `00023_order_surcharge_total.sql`. Shared: `computeOrderTotals`, `deriveAdjustmentsFromFinalPrice`.

| Tab                     | Comportamiento                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Precio final**        | Input = total a cobrar (**incluye** envío). Deriva **XOR**: `final < subtotal+shipping` → solo `discountTotal`; `final > base` → solo `surchargeTotal`; igual → ambos 0. |
| **Descuento / recargo** | Inputs independientes; **pueden coexistir** (p. ej. discount 5 + surcharge 2).                                                                                           |

Los ajustes **no** mutan precios de línea (`packagePrice` / `unitPrice` / `lineTotal`) — Regla 16.

Ecommerce / guest: `discountTotal = 0`, `surchargeTotal = 0`.

### Validación cliente

`helpers/order-form-validation.ts`:

1. Arma input con líneas dual + `shippingTotal` / `discountTotal` / `surchargeTotal`.
2. Parsea con `createOrderInputSchema` (`@de-tin-marin/validations/order`).
3. Mapea issues Zod → errores por campo (contacto, fulfillment, líneas, totales).

### Preview de precios

| Query             | Fresco                   | Motivo                                  |
| ----------------- | ------------------------ | --------------------------------------- |
| `bundle-preview`  | Sí (`freshQueryOptions`) | Total alineado con `createOrderService` |
| `cart-preview`    | Sí (`freshQueryOptions`) | Totales de líneas + cabecera al crear   |
| Catálogo auxiliar | Paginado / on-demand     | Picker / tabs                           |

## Listado `/orders`

SSR + `HydrationBoundary` (mismo patrón que catálogo admin). Default pageSize **5** (`ADMIN_DEFAULT_PAGE_SIZE`).

## Detalle `/orders/[id]`

- Muestra `shoppingCart` congelado (product dual, pack BOM, bundle components).
- Totales: `subtotal`, `discountTotal`, **`surchargeTotal`**, `shippingTotal`, `total`.
- Acciones: confirmar pago / reembolso / transición logística / envío (S2C).

## Services

- `order.service.ts` — carrito congelado, transiciones. `listOrdersPageService` valida `page`/`pageSize` con `@de-tin-marin/validations/admin-list` (orden `created_at desc`, sin filtros)
- `order-preview.service.ts` — preview bundle/cart (`buildOrderCartWithTotals`)
- `payment.service.ts` — confirmar / reembolsar pago (deduct atómico S2A)
- `shipment.service.ts` — upsert envío

Stock pre-confirm: `checkOrderStock` requiere `productType` en filas de producto (Regla 15 / DECISIONS #29).

Demandas:

| Línea     | Demanda                                                               |
| --------- | --------------------------------------------------------------------- |
| `product` | `presentationQuantity = packageQuantity`, `baseUnits = unitQuantity`  |
| `pack`    | por componente: `totalPackages` → presentaciones, `totalUnits` → base |
| `bundle`  | `totalQuantity` → base + envase                                       |

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

Actions: `guardAction` (shim → `@de-tin-marin/logging`). Services críticos
(`createOrder`, confirm payment, etc.) también usan `logServerInfo` /
`logServerError` con meta segura (conteos, IDs; sin `shopping_cart` ni contacto).

Paginación `/orders`: mismos patrones que catálogo — [S3B/01-admin-list-pagination.md](../../../docs/stages/S3B/01-admin-list-pagination.md).

## Shared / migraciones

| Artefacto                                      | Rol                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `@de-tin-marin/shared/order-cart`              | normalize product dual, build lines, totals, `deriveAdjustmentsFromFinalPrice` |
| `@de-tin-marin/shared/product-purchase-limits` | `mode: admin\|customer`, `clampProductDualQuantities`                          |
| `00023_order_surcharge_total.sql`              | columna `surcharge_total`                                                      |
| `00024_product_line_dual_quantity.sql`         | rewrite legacy `quantity` → dual en JSONB histórico                            |
