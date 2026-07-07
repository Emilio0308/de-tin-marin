# Pricing — De Tin Marín

> **Responsabilidad:** calcular y exponer precios finales en el **backend**. El frontend **no recalcula**.

> **Acotación v1 (DECISIONS #24):** `finalPrice` ya se expone en el listado de productos vía `computeFinalPrice`, pero **sin campañas asignadas** equivale a `normal.netPrice`. No hay descuentos activos hasta que se habilite la gestión de campañas.

## v1 — Dos contextos

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

**Reglas:** 2, 9, 10, 11, 12.

### B) Sorpresas (bundles) — al crear la orden

Los bundles **no tienen precio fijo en catálogo** para venta. El total se calcula al armar el pedido:

```text
Por cada component en una línea bundle del shopping_cart:
  totalQuantity × finalUnitPrice   (campaña ya aplicada)

+ service_fee × quantity (línea bundle)
= lineTotal
```

Preview en admin (sin campaña): `prices.unit.netPrice × units_per_person`.

**Regla:** 8.

## Fuera de v1

- Cupones
- VIP / tier
- Pipeline multi-paso (campaña → cupón → VIP)
- Tipos `suggested`, `fantasy` (estructura JSONB lista, sin lógica)
- Envases de sorpresa como ítem inventariado (DECISIONS #30)

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
- Al guardar: operador ingresa precio presentación → backend calcula `unit`.
- Campañas operan sobre `normal.netPrice`; `finalUnitPrice` derivado.

## Integración con Orders

| Momento          | Qué hace Pricing                                              |
| ---------------- | ------------------------------------------------------------- |
| Listar productos | Devuelve `finalPrice` + `finalUnitPrice` por producto         |
| Armar sorpresa   | Calcula preview con `unit.netPrice` o `finalUnitPrice`        |
| Confirmar orden  | Snapshot `unitPrice` en `shopping_cart` — Orders no recalcula |

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
- Sorpresa: 25 u. × 6 productos + service_fee (precios unit)
- Reemplazo producto 4 por 8 → precio refleja producto 8

## Reglas relacionadas

Reglas 2, 8–12 en [`business-rules.md`](business-rules.md).

## Brief refactor precios/stock

[S1D/01-products-packages-stock.md](stages/S1D/01-products-packages-stock.md)
