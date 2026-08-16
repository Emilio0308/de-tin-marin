# Módulo `bundle-wizard`

Wizard de personalización de sorpresas (S3A-2), integrado con el carrito (S3A-3).

## Rutas

- `/sorpresas/[id]/personalizar`

## Boundaries

| Action / Service           | Descripción                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `getBundleForWizardAction` | Plantilla + `description` + items + container + `personCount`   |
| `previewBundleLineAction`  | Preview precio + stock vía `buildOrderCart` y `checkOrderStock` |

UI: si `template.description` no es `null`, se muestra bajo el encabezado de la plantilla.

## Integración con carrito

Al confirmar, `BundleWizardPageContainer` llama `useCart().addBundleLine()` con la línea congelada (`OrderShoppingCartBundleLine`) y redirige a `/carrito`.

`helpers/pending-cart.ts` sigue disponible para migrar líneas legacy de `sessionStorage` → `localStorage` al montar el carrito.

## Reglas de composición

- Mínimo / máximo **por sorpresa**: `catalog.bundles.customization_min_products` / `customization_max_products` (defaults **8** / **20**; techo **100**).
- Helpers: `resolveBundleCustomizationBounds` + `validateBundleCustomization(components, bounds)` en `@de-tin-marin/validations/customize-bundle`.
- `getBundleForWizardService` expone los límites en la plantilla y recorta `initialComponents` al máximo de **esa** sorpresa.
- La plantilla y el estado del wizard tienen productos por `productId` único;
  la cardinalidad cuenta productos distintos, no
  `unitsPerPerson` ni personas de la sorpresa.
- Preview solo corre para una composición válida. El service vuelve a cargar
  los límites de la plantilla y valida antes de calcular precio o stock:
  los límites recibidos en el cliente no son una autorización.
- El order-form admin usa los mismos límites al personalizar una línea bundle.
  Crear la orden vuelve a validarlos; el snapshot resultante no cambia si el
  administrador edita la plantilla después.
- Persistencia: `00025_bundle_customization_limits.sql` agrega ambas columnas,
  conserva bundles existentes con 8/20 y aplica `1 ≤ min ≤ max` en DB. El
  máximo absoluto de 100 se aplica en Zod/app.
