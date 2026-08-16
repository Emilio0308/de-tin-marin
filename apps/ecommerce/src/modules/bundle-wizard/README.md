# Módulo `bundle-wizard`

Wizard de personalización de sorpresas (S3A-2), integrado con el carrito (S3A-3).

## Rutas

- `/sorpresas/[id]/personalizar`

## Boundaries

| Action / Service           | Descripción                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `getBundleForWizardAction` | Plantilla + `description` + items + container + `personCount` (= `bundles.quantity`, sorpresas) |
| `previewBundleLineAction`  | Preview precio + stock con `quantity` editable (15–100)                                         |

UI: si `template.description` no es `null`, se muestra bajo el encabezado de la plantilla.

## Cantidad de sorpresas

- `bundles.quantity` / `template.personCount` = cantidad de **sorpresas** de la plantilla (default; `personCount` es nombre legacy en el DTO).
- `line.quantity` = sorpresas pedidas (multiplica dulces, envase y precio); puede diferir del default tras editar en el wizard.
- Ecommerce / guest: **15 ≤ quantity ≤ 100** (`BUNDLE_LINE_QUANTITY_MIN` / `MAX`).
- Valor inicial: `clampBundleLineQuantity(template.personCount)`.
- Admin order-form: `quantity >= 1` sin tope ecommerce.
- Guest checkout revalida el rango 15–100 en `createGuestOrderInputSchema`.

## Integración con carrito

Al confirmar, `BundleWizardPageContainer` llama `useCart().addBundleLine()` con la línea congelada (`OrderShoppingCartBundleLine`) y redirige a `/carrito`.

`helpers/pending-cart.ts` sigue disponible para migrar líneas legacy de `sessionStorage` → `localStorage` al montar el carrito.

## Reglas de composición

- Mínimo / máximo **por sorpresa**: `catalog.bundles.customization_min_products` / `customization_max_products` (defaults **8** / **20**; techo **100**).
- Helpers: `resolveBundleCustomizationBounds` + `validateBundleCustomization(components, bounds)` en `@de-tin-marin/validations/customize-bundle`.
- `getBundleForWizardService` expone los límites en la plantilla y recorta `initialComponents` al máximo de **esa** sorpresa.
- La plantilla y el estado del wizard tienen productos por `productId` único;
  la cardinalidad cuenta productos distintos, no
  `unitsPerPerson` ni la cantidad de sorpresas.
- Preview solo corre para una composición válida **y** `quantity` en 15–100. El service
  vuelve a cargar los límites de la plantilla y valida antes de calcular precio o stock:
  los límites recibidos en el cliente no son una autorización.
- El order-form admin usa los mismos límites de **dulces** al personalizar; la cantidad de
  sorpresas en admin no usa el tope 15–100.
- Persistencia: `00025_bundle_customization_limits.sql` agrega ambas columnas,
  conserva bundles existentes con 8/20 y aplica `1 ≤ min ≤ max` en DB. El
  máximo absoluto de 100 se aplica en Zod/app.
