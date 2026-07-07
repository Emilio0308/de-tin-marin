# Módulo `bundle-wizard`

Wizard de personalización de sorpresas (S3A-2).

## Rutas

- `/sorpresas/[id]/personalizar`

## Boundaries

| Action / Service           | Descripción                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `getBundleForWizardAction` | Plantilla + items + container + `personCount`                   |
| `previewBundleLineAction`  | Preview precio + stock vía `buildOrderCart` y `checkOrderStock` |

## Salida hacia carrito (stub)

`helpers/pending-cart.ts` persiste `OrderShoppingCartBundleLine` en `sessionStorage` hasta S3A-3.
