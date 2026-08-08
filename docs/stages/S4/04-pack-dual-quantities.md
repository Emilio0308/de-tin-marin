# S4-04 · Pack BOM: package_quantity + unit_quantity

|                |                                                        |
| -------------- | ------------------------------------------------------ |
| **Etapa**      | S4 — Completitud                                       |
| **Owner**      | Equipo De Tin Marín                                    |
| **App(s)**     | `apps/admin`, `apps/ecommerce`                         |
| **Schemas**    | `catalog`, `commerce`                                  |
| **Depende de** | S1F packs ✅, S2A deduct ✅, S3A-05 ecommerce packs ✅ |
| **Estado**     | done                                                   |

## Contexto (leer esto, no todo docs/)

- Packs: BOM fija en `catalog.pack_items`; sin stock propio (DECISIONS #33 / Reglas 22–24).
- Hasta ahora solo `package_quantity` (presentaciones ≥ 1). Negocio necesita combinar tiras **y** bolsas sueltas en la misma fila (p. ej. 3 + 5).
- Una fila por producto (`unique (pack_id, product_id)`).
- Al `paid`, product/pack/bundle agregan a un mapa compartido; motor `need = presentationQuantity × ipp + baseUnits` + deduct por `product_type`. Ampliar **solo** branch pack.

## Objetivo

Staff puede definir por componente `package_quantity` y `unit_quantity` (suma ≥ 1); reference, disponibilidad, carrito y deduct al `paid` respetan ambas cantidades sin romper sorpresas.

## Scope IN

- Migración `00022_pack_items_unit_quantity.sql` + pgTAP
- Shared: `pack-price`, `pack-availability`, `order-cart`, `check-order-stock`
- Validations pack/order + public catalog
- Admin pack form (dos steppers), service/repo, orders admin, reports
- Ecommerce detalle/checkout snapshot
- Docs canónicos sincronizados

## Scope OUT (traps)

- **NO** cambiar branch `type: bundle` ni deduct de envases → _romper sorpresas_
- **NO** tocar `deductProductStock` / `_deduct_*` / semántica `product_type` → _overselling_
- **NO** stock propio en `packs` → _doble inventario_
- **NO** packs anidados ni dos filas del mismo producto → _ciclos / unique_
- **NO** enum UOM excluyente (package XOR unit) → _no permite 3 tiras + 5 u._
- **NO** `index.ts` barrels

## Tablas y RLS

| Tabla (schema)                    | ¿Nueva?             | Ops                                | Política         | Test                                        |
| --------------------------------- | ------------------- | ---------------------------------- | ---------------- | ------------------------------------------- |
| `catalog.pack_items`              | alter               | + `unit_quantity`; checks dual qty | Sin cambio RLS   | `supabase/tests/catalog__pack_items.sql`    |
| `commerce.deduct_stock_for_order` | replace pack branch | `totalUnits` → `baseUnits`         | security definer | `supabase/tests/commerce__deduct_stock.sql` |

## Boundaries y DTOs

| Boundary    | Cambio clave                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Pack item   | `{ productId, packageQuantity, unitQuantity }` suma ≥ 1                                              |
| Pack cart   | + `unitQuantity`, `totalUnits` (legacy ausente → 0)                                                  |
| Reference   | Σ(`normal×packageQuantity` + `unit×unitQuantity`)                                                    |
| Disponibles | `floor(availableBase / (packageQuantity×ipp + unitQuantity))`; admin list + `listPackStockShortages` |

## Rules que aplican

- [`00-architecture`](../../rules/00-architecture.md)
- [`40-validation-and-boundaries`](../../rules/40-validation-and-boundaries.md)
- [`85-react-components`](../../rules/85-react-components.md)

## Criterios de aceptación

- [x] Migración + pgTAP: ítem solo unit, solo package, dual 3+5; deduct pack dual + regresión bundle
- [x] Vitest pack-price / pack-availability / check-order-stock (incl. mix pack+bundle)
- [x] Admin form dual steppers; `normal >= reference` con ambos precios
- [x] Ecommerce detalle + checkout congelan `totalUnits`
- [x] `pnpm typecheck` + lint + format + `pnpm build` (admin + ecommerce)

## Referencias

- [DECISIONS.md](../../DECISIONS.md) #33
- [business-rules.md](../../business-rules.md) Reglas 15, 22–24
- [database.md](../../database.md) § packs
