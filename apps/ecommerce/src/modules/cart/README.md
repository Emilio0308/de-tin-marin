# Módulo `cart`

Carrito del cliente (S3A-3).

Reglas de fetching: [`docs/rules/50-data-fetching-cache-ssr.md`](../../../../docs/rules/50-data-fetching-cache-ssr.md) · DECISIONS #32.

## Patrón de datos

**CSR + React Query con `freshQueryOptions`** (`staleTime: 0`) — precios, límites de compra y stock deben estar actualizados al revisar el carrito.

```text
cart-page.container
  → useQuery (fresh) → Server Actions
    → getPublicProductAction / checkCartStockAction
```

| Query                               | Key                          | Fresco |
| ----------------------------------- | ---------------------------- | ------ |
| Metadata producto (precio, límites) | `queryKeys.cart.productMeta` | Sí     |
| Imágenes faltantes                  | `queryKeys.cart.lineImages`  | Sí     |
| Stock                               | `queryKeys.checkout.stock`   | Sí     |

Estado del carrito: `localStorage` vía `useCart`. **Precios** se recalculan en servidor con `previewGuestOrderCartAction` (`buildOrderCartWithTotals`) y se sincronizan al storage vía `useCartPricingPreview` — refetch cada 30 s y al volver a la pestaña.

## Contrato desde wizard

El wizard guarda líneas bundle congeladas en `sessionStorage` bajo `dtm-pending-cart-lines`.

Tipo: `OrderShoppingCartBundleLine` de `@de-tin-marin/shared/order-cart`.

## Ruta

- `/carrito` — `cart-page.container`
