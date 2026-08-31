# S4-13 · Normalización precio sorpresa (bundle)

|                |                                                                   |
| -------------- | ----------------------------------------------------------------- |
| **Etapa**      | S4 — Completitud / pricing                                        |
| **Owner**      | Equipo De Tin Marín                                               |
| **App(s)**     | `apps/admin`, `apps/ecommerce`, `packages/shared`                 |
| **Schemas**    | — (sin migración; snapshot JSONB en `shopping_cart`)              |
| **Depende de** | S1B bundles ✅, S1D unit prices ✅, S1E envases ✅, S3A wizard ✅ |
| **Estado**     | done                                                              |
| **Plan ref.**  | `bundle_price_normalization_7a641cd8.plan.md`                     |

## Contexto

Sumar envase + dulces (`prices.unit.netPrice`) puede dejar precios “rotos”
(p. ej. S/ 10.15/sorpresa). El negocio redondea **hacia arriba** al múltiplo
configurable (default **S/ 0.50**) sin persistir precio en `catalog.bundles`.

## Objetivo

Un solo motor en `@de-tin-marin/shared/bundle-price` calcula raw + normalizado;
snapshot congela ambos; cobro/UI/emails usan el total comercial.

## Fórmula

```text
rawPerSurprise           = containerNetPrice + Σ (unitNetPrice × unitsPerPerson)
normalizedPerSurprise    = normalizeBundlePrice(rawPerSurprise, step)   // default step 0.5
lineTotal                = quantity × rawPerSurprise                   // auditoría
normalizedLineTotal      = quantity × normalizedPerSurprise            // cobro
```

## Scope IN

- `normalizeBundlePrice`, `computeBundlePerSurprisePrice`, `computeBundleTotal`
- `order-cart`: `buildBundleLine`, `getBundleLineChargeableTotal`, `computeOrderTotals`
- `build-order-cart`: componentes bundle con `unitNetPrice` (sin campaña v1)
- Zod/DTOs: `normalizedPerSurprisePrice`, `normalizedLineTotal`; admin `rawTotal`
- Servicios: bundle, public-catalog, order-preview, guest drift, cart sync
- UI admin/ecommerce + emails/reportes con línea cobrable

## Scope OUT (traps)

- **NO** campañas en componentes de sorpresa v1
- **NO** repartir el premium de redondeo entre componentes
- **NO** columna de precio en `catalog.bundles`
- **NO** recalcular órdenes legacy sin campos nuevos (fallback `lineTotal`)

## Rules / decisiones

- Regla **8**, Regla **16** (subtotal cobrable), DECISIONS **#45** (actualiza #6)

## Criterios de aceptación

- [x] 10.15/sorpresa → 10.50; catálogo admin muestra `total` + `rawTotal`
- [x] Snapshot guarda `lineTotal` crudo + `normalizedLineTotal`
- [x] Checkout drift compara cobrable; carrito sync actualiza ambos campos
- [x] Emails/reportes usan total cobrable en bundles
- [x] Tests: `bundle-price`, `order-cart`, `build-order-cart`, parity wizard, cart-lines
- [x] `pnpm check` + `pnpm build` verdes

## Referencias

- [`docs/pricing.md`](../../pricing.md) § B
- [`docs/orders.md`](../../orders.md) § línea bundle
- [`docs/business-rules.md`](../../business-rules.md) Regla 8
