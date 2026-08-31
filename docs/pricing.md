# Pricing — De Tin Marín

> **Responsabilidad:** calcular y exponer precios finales en el **backend**. El frontend **no recalcula**.

> **Acotación v1 (DECISIONS #24):** `finalPrice` ya se expone en el listado de productos vía `computeFinalPrice`, pero **sin campañas asignadas** equivale a `normal.netPrice`. No hay descuentos activos hasta que se habilite la gestión de campañas.

## v1 — Tres contextos

### A) Productos sueltos — listado catálogo

El precio se resuelve **en la query** al listar productos:

```text
prices.normal.netPrice   (presentación: tira/paquete)
  ↓
¿campaign_id vigente?
  → sí: finalPrice = netPrice × (1 - percentage/100)
  → no: finalPrice = netPrice

finalUnitPrice = finalPrice / items_per_package
  (sin campaña: prices.unit.netPrice)
```

Incluir en el DTO de respuesta:

```typescript
type ProductPriceDTO = {
  normal: {
    netPrice: number;
    igv: number;
    subtotal: number;
  };
  unit: {
    netPrice: number;
    igv: number;
    subtotal: number;
  };
  itemsPerPackage: number;
  finalPrice: number; // presentación con campaña
  finalUnitPrice: number; // unidad base con campaña
  campaign?: {
    id: string;
    name: string;
    percentage: number;
  };
};
```

**Línea orden `type: product` (DECISIONS #27):** al congelar, `packagePrice = finalPrice`, `unitPrice = finalUnitPrice`, `lineTotal = packagePrice × packageQuantity + unitPrice × unitQuantity`. Admin puede aportar ambos qty; ecommerce solo presentaciones (`unitQuantity = 0`). Ajustes de cabecera (`discount`/`surcharge`) **no** entran en esta línea — ver [`orders.md`](orders.md) § Totales.

**Reglas:** 2, 9, 10, 11, 12.

> **Costo / margen (admin, DECISIONS #36 / Regla 26):** `cost_net_price` es dato de adquisición; **no** forma parte del pipeline de `finalPrice` ni de DTOs públicos. Margen = `normal.netPrice − cost` (derivado en app vía `computeProductMargin`).

### B) Sorpresas (bundles) — al crear la orden

Los bundles **no tienen precio fijo persistido**. El total se calcula al armar el pedido con `@de-tin-marin/shared/bundle-price`:

```text
rawPerSurprise        = containerNetPrice + Σ (unitNetPrice × units_per_person)
normalizedPerSurprise = ceil(rawPerSurprise / step) × step    // step default S/ 0.50
lineTotal             = quantity × rawPerSurprise             // snapshot (auditoría)
normalizedLineTotal   = quantity × normalizedPerSurprise      // cobro y UI
```

- Componentes: siempre `prices.unit.netPrice` (sin campaña en sorpresas v1).
- Catálogo admin: `total` = normalizado; `rawTotal` = crudo (solo admin).
- Catálogo ecommerce: `total` = normalizado.
- Totales de orden / checkout: `getBundleLineChargeableTotal(line)`.

**Regla:** 8. DECISIONS #45.

### C) Packs / combos — precio persistido

```text
reference = Σ (normal × package_quantity + unit × unit_quantity)   // al guardar
normal    = precio admin  (≥ reference)
finalPrice = computeFinalPrice(normal, campaign)                     // listado / orden
```

Línea orden: `unitPrice = finalPrice` congelado; BOM congelada (`packageQuantity` + `unitQuantity`) para deduct.

**Reglas:** 22–25. DECISIONS #33.

## Fuera de v1

- Cupones
- VIP / tier
- Pipeline multi-paso (campaña → cupón → VIP)
- Tipos `suggested`, `fantasy` (estructura JSONB lista, sin lógica)
- Envases de sorpresa como ítem inventariado (DECISIONS #30)
- Margen/costo en packs, bundles o DTOs públicos ecommerce

## Estructura `prices` en BD

```json
{
  "normal": { "netPrice": 6.0, "igv": 0.92, "subtotal": 5.08 },
  "unit": { "netPrice": 0.6, "igv": 0.09, "subtotal": 0.51 },
  "suggested": {},
  "fantasy": {}
}
```

| Clave    | Uso v1                                               |
| -------- | ---------------------------------------------------- |
| `normal` | Precio **presentación**; campañas; listado catálogo  |
| `unit`   | Precio **unidad base**; bundles; costeo por sorpresa |

- `normal.netPrice` y `unit.netPrice` = precio final con IGV incluido.
- Al guardar: operador ingresa precio presentación → backend calcula `unit` con **ceil a 2 decimales** (`buildPricesFromPackageNetPrice`) — Regla 2.
- Campañas operan sobre `normal.netPrice`; `finalUnitPrice` derivado.

## Integración con Orders

| Momento          | Qué hace Pricing                                                          |
| ---------------- | ------------------------------------------------------------------------- |
| Listar productos | Devuelve `finalPrice` + `finalUnitPrice` por producto                     |
| Armar sorpresa   | `prices.unit.netPrice` en componentes (sin campaña v1); normalización #45 |
| Confirmar orden  | Snapshot `unitPrice` + `normalizedLineTotal`; Orders no recalcula         |

## Módulo

```text
src/modules/pricing/
  services/product-price.service.ts   # finalPrice + finalUnitPrice + campaña
  services/bundle-line-price.service.ts  # total línea sorpresa
  schemas/...
```

## Tests obligatorios (Vitest)

- Producto sin campaña → `finalPrice === normal.netPrice`, `finalUnitPrice === unit.netPrice`
- Producto paquete (10 u): coherencia `unit × 10 ≈ normal`
- Producto con campaña 20% vigente → `finalUnitPrice = finalPrice / items_per_package`
- Campaña expirada → precio normal
- Sorpresa: raw + normalizado (ej. 10.15/sorpresa → 10.50); `getBundleLineChargeableTotal`
- Reemplazo producto 4 por 8 → precio refleja producto 8

## Reglas relacionadas

Reglas 2, 8–12, 26 en [`business-rules.md`](business-rules.md).

## Briefs

- [S1D/01-products-packages-stock.md](stages/S1D/01-products-packages-stock.md)
- [S4/02-product-cost-margin.md](stages/S4/02-product-cost-margin.md)
