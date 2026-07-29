# Módulo `checkout`

Formulario de checkout, mapa de entrega y creación de orden `pending_payment` (S3A-3).

Lee flags desde `@/config/store` (`storeFeatures`).

Reglas de fetching: [`docs/rules/50-data-fetching-cache-ssr.md`](../../../../docs/rules/50-data-fetching-cache-ssr.md) · DECISIONS #32.

## Validación al submit

No hay polling de stock en checkout. Al confirmar:

1. `validateGuestCheckoutCartAction` — precios vigentes + stock en una ida.
2. Si hay drift (`priceChanged` / `!stockOk`) → `dtm-cart-sync` + redirect `/carrito?sync=1`.
3. Si OK → `createGuestOrderAction` (revalida en servidor).

Fee de delivery sigue con `freshQueryOptions`. Zonas usan caché default.
