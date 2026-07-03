# Pricing — De Tin Marín

> **Responsabilidad:** calcular y exponer precios finales en el **backend**. El frontend **no recalcula**.

> **Acotación v1 (DECISIONS #24):** `finalPrice` ya se expone en el listado de productos vía `computeFinalPrice`, pero **sin campañas asignadas** equivale a `netPrice`. No hay descuentos activos hasta que se habilite la gestión de campañas.

## v1 — Dos contextos

### A) Productos sueltos — listado catálogo

El precio se resuelve **en la query** al listar productos:

```text
prices.normal.netPrice
  ↓
¿campaign_id vigente?
  → sí: finalPrice = netPrice × (1 - percentage/100)
  → no: finalPrice = netPrice
```

Incluir en el DTO de respuesta:

```typescript
type ProductPriceDTO = {
  normal: {
    netPrice: number;
    igv: number;
    subtotal: number;
  };
  finalPrice: number;
  campaign?: {
    id: string;
    name: string;
    percentage: number;
  };
};
```

**Reglas:** 9, 10, 11, 12.

### B) Sorpresas (bundles) — al crear la orden

Los bundles **no tienen precio fijo en catálogo** para venta. El total se calcula al armar el pedido:

```text
Por cada componente en order_bundle_items:
  total_quantity × unit_price_final (precio producto con campaña ya aplicada)

+ service_fee × cantidad_de_sorpresas (order_item.quantity)
= line_total
```

**Regla:** 8.

## Fuera de v1

- Cupones
- VIP / tier
- Pipeline multi-paso (campaña → cupón → VIP)
- Tipos `suggested`, `fantasy` (estructura JSONB lista, sin lógica)

## Estructura `prices` en BD

```json
{
  "normal": { "netPrice": 100, "igv": 18, "subtotal": 82 },
  "suggested": {},
  "fantasy": {}
}
```

- `netPrice` = precio final con IGV incluido.
- Campañas v1 operan solo sobre `normal.netPrice`.

## Integración con Orders

| Momento          | Qué hace Pricing                                     |
| ---------------- | ---------------------------------------------------- |
| Listar productos | Devuelve `finalPrice` por producto                   |
| Armar sorpresa   | Calcula preview de línea (componentes + fee)         |
| Confirmar orden  | Genera snapshot → Orders persiste y **no recalcula** |

## Módulo

```text
src/modules/pricing/
  services/product-price.service.ts   # finalPrice + campaña
  services/bundle-line-price.service.ts  # total línea sorpresa
  schemas/...
```

## Tests obligatorios (Vitest)

- Producto sin campaña → `finalPrice === netPrice`
- Producto con campaña 20% vigente
- Campaña expirada → precio normal
- Sorpresa: 25 u. × 6 productos + service_fee
- Reemplazo producto 4 por 8 → precio refleja producto 8

## Reglas relacionadas

Reglas 8–12 en [`business-rules.md`](business-rules.md).
