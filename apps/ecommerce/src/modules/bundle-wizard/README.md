# Módulo `bundle-wizard`

Wizard de personalización de sorpresas (S3A-2), integrado con el carrito (S3A-3).

## Rutas

- `/sorpresas/[id]/personalizar`

## Boundaries

| Action / Service           | Descripción                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `getBundleForWizardAction` | Plantilla + items + container + `personCount`                   |
| `previewBundleLineAction`  | Preview precio + stock vía `buildOrderCart` y `checkOrderStock` |

## Integración con carrito

Al confirmar, `BundleWizardPageContainer` llama `useCart().addBundleLine()` con la línea congelada (`OrderShoppingCartBundleLine`) y redirige a `/carrito`.

`helpers/pending-cart.ts` sigue disponible para migrar líneas legacy de `sessionStorage` → `localStorage` al montar el carrito.

## Reglas de composición

- Mínimo / máximo: `BUNDLE_CUSTOMIZATION_MIN` (5) y `BUNDLE_CUSTOMIZATION_MAX` (20) en `@de-tin-marin/validations/customize-bundle`.
- `getBundleForWizardService` recorta `initialComponents` al máximo permitido si la plantilla admin tiene más dulces activos.
