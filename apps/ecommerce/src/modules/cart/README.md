# Módulo `cart`

Carrito del cliente (S3A-3).

Reglas de fetching: [`docs/rules/50-data-fetching-cache-ssr.md`](../../../../docs/rules/50-data-fetching-cache-ssr.md) · DECISIONS #32.

## Patrón de datos

**CSR + React Query con `freshQueryOptions`** — sync de precios/límites/stock **al montar** (sin polling 30 s). Checkout valida de forma estricta al submit.

```text
cart-page.container
  → useQuery (fresh) → Server Actions
    → getCartLineMetaAction (batch) / checkCartStockAction / previewGuestOrderCartAction
```

| Query                           | Key                          | Fresco |
| ------------------------------- | ---------------------------- | ------ |
| Metadata líneas (producto/pack) | `queryKeys.cart.productMeta` | Sí     |
| Imágenes bundle faltantes       | `queryKeys.cart.lineImages`  | Sí     |
| Stock                           | `queryKeys.checkout.stock`   | Sí     |
| Pricing preview                 | `queryKeys.cart.pricing`     | Sí     |

Estado del carrito: `localStorage` vía `useCart` (líneas `product` | `bundle` | `pack`). **Precios** se recalculan en servidor con `previewGuestOrderCartAction` y se sincronizan al storage vía `useCartPricingPreview`.

## Sync desde checkout (`?sync=1`)

Si checkout detecta drift de precio o stock:

1. Escribe `sessionStorage` (`dtm-cart-sync`) con líneas servidor + flags.
2. Redirige a `/carrito?sync=1`.
3. Carrito aplica precios, purga líneas sin stock y muestra toast (sonner).

Helpers: `helpers/cart-sync.ts`.

## Contrato desde wizard

El wizard guarda líneas bundle congeladas en `sessionStorage` bajo `dtm-pending-cart-lines`.

Tipo: `OrderShoppingCartBundleLine` de `@de-tin-marin/shared/order-cart`.

Combos se añaden desde `/combos/[slug]` o tab home sin wizard (BOM fija en snapshot).

## Ruta

- `/carrito` — `cart-page.container`
