# Módulo `cart`

Carrito del cliente (S3A-3).

## Contrato desde wizard (S3A-2 stub)

El wizard guarda líneas bundle congeladas en `sessionStorage` bajo la clave `dtm-pending-cart-lines`.

Tipo: `OrderShoppingCartBundleLine` de `@de-tin-marin/shared/order-cart` (alias `PendingCartBundleLine` en `bundle-wizard/helpers/pending-cart.ts`).

S3A-3 debe migrar estas líneas a `localStorageCartRepository` sin transformar la estructura.

## Estructura prevista

`stores/` o estado cliente, `components/`, `actions/`, `repositories/local-storage-cart.repository.ts`
