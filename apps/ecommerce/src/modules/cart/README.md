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

Estado del carrito: `localStorage` vía `useCart` (líneas `product` | `bundle` | `pack`). **Precios** se recalculan en servidor con `previewGuestOrderCartAction` y se sincronizan al storage vía `useCartPricingPreview` (bundles: `normalizedLineTotal`, `normalizedPerSurprisePrice` + `lineTotal` crudo).

Display y totales de línea bundle usan `getBundleLineChargeableTotal` (DECISIONS #45 · brief [S4-13](../../../../docs/stages/S4/13-bundle-price-normalization.md)).

### Líneas `type: product` (DECISIONS #27)

Shape alineado con `OrderShoppingCart` / checkout Zod:

- `packageQuantity` — presentaciones pedidas (la “cantidad” de UI tienda).
- `unitQuantity` — **siempre `0`** en ecommerce/guest (no se venden sueltas en storefront).
- Checkout / preview: `surchargeTotal = 0`, `discountTotal = 0`.

Límites min/max y stock: Regla 21 (`mode: "customer"`). Admin dual qty: [`docs/orders.md`](../../../../docs/orders.md) · módulo admin orders.

## Sync desde checkout (`?sync=1`)

Si checkout detecta drift de precio o stock:

1. Escribe `sessionStorage` (`dtm-cart-sync`) con líneas servidor + flags.
2. Redirige a `/carrito?sync=1`.
3. Carrito aplica precios, purga líneas sin stock y muestra toast (sonner).

Helpers: `helpers/cart-sync.ts`.

## Contrato desde wizard

El wizard agrega directamente una línea bundle congelada a `localStorage` con
`useCart().addBundleLine()` y luego redirige a `/carrito`. La clave
`dtm-pending-cart-lines` en `sessionStorage` se conserva solo para migrar
líneas legacy al montar.

Tipo: `OrderShoppingCartBundleLine` de `@de-tin-marin/shared/order-cart`.

### Líneas `type: bundle` en ecommerce / guest

- `line.quantity` es el número de **sorpresas** pedidas (mismo significado que
  `bundles.quantity` en plantilla; el wizard puede cambiarlo respecto al
  default).
- Debe ser un entero entre **15 y 100**. El wizard inicia con
  `clampBundleLineQuantity(template.personCount)` (`personCount` =
  `bundles.quantity`) y el preview recalcula precio y stock al cambiarla.
- `createGuestOrderInputSchema` vuelve a imponer el rango al checkout: no se
  confía en el valor almacenado en el navegador.
- La cantidad multiplica componentes (`totalQuantity`) y envases del snapshot.
  La comprobación de stock puede mostrar warning en wizard; checkout decide la
  validación estricta según su feature flag.
- No se mezclan líneas bundle equivalentes: cada personalización se agrega
  como una línea independiente.

Combos se añaden desde `/combos/[slug]` o tab home sin wizard (BOM fija en snapshot).

## Ruta

- `/carrito` — `cart-page.container`
