# S1F · Catálogo — Packs / Combos (admin)

|                |                                                    |
| -------------- | -------------------------------------------------- |
| **Etapa**      | S1F — Packs ([roadmap.md](../../roadmap.md) § S1F) |
| **Owner**      | Equipo De Tin Marín                                |
| **App(s)**     | `apps/admin`                                       |
| **Schemas**    | `catalog`, `commerce`                              |
| **Depende de** | S1A ✅, S1C ✅, S1D ✅, S2A ✅, S2B ✅             |
| **Estado**     | done                                               |

## Contexto (leer esto, no todo docs/)

- Combos ≠ sorpresas: sin personas, sin envase, composición fija (DECISIONS #33).
- Precio: JSONB `prices.reference` + `prices.normal` (admin). **`normal >= reference`**.
  - **S1F (histórico):** `reference` = Σ(`normal` × `package_quantity`).
  - **S4-04 (actual):** `reference` = Σ(`normal` × `package_quantity` + `unit` × `unit_quantity`); ver [S4/04](../S4/04-pack-dual-quantities.md).
- Stock: sin columnas en `packs`; disponibilidad y deduct al `paid` vía componentes (S4-04: presentaciones **y** unidades base).
- Campaña 1:1 (`campaign_id`) + `purchase_min_quantity` / `purchase_max_quantity`.
- Patrón CRUD: Action → Service → Repository como bundles ([S1B](../S1B/01-bundles.md)).

## Objetivo

Staff en admin (:3001) puede CRUD combos (packs) con composición de dulces en paquetes, precio reference/normal, campaña y min/max; y venderlos en órdenes admin con deduct de componentes al `paid`.

## Scope IN

- Migración `00016_catalog_packs.sql` + pgTAP + grants
- Alter `commerce.deduct_stock_for_order` para líneas `type: pack`
- `@de-tin-marin/shared`: `pack-price`, prices pack, `order-cart` pack, `check-order-stock`, `build-order-cart`
- `@de-tin-marin/validations`: schemas pack + order pack line
- Admin catalog: CRUD Combos + nav `/packs`
- Admin orders: línea pack (sin personalización) + stock check/deduct
- Docs canónicos sincronizados

## Scope OUT (traps)

- **NO ecommerce** — `/combos`, carrito guest → _scope creep_
- **NO stock propio en packs** → _doble inventario_
- **NO `normal < reference`** — descuentos solo vía campaña → _bypass de pricing_
- **NO personalización de BOM en orden** → _divergencia plantilla_
- **NO packs anidados** → _ciclos_
- ~~NO UOM unidad base~~ — **superseded** por [S4-04](../S4/04-pack-dual-quantities.md) (`package_quantity` + `unit_quantity` en la misma fila)
- **NO `index.ts` barrels**

## Tablas y RLS

| Tabla (schema)       | ¿Nueva? | Ops                               | Política                         | Test                                     |
| -------------------- | ------- | --------------------------------- | -------------------------------- | ---------------------------------------- |
| `catalog.packs`      | sí      | SELECT público activos; CUD staff | Público activos; staff todo      | `supabase/tests/catalog__packs.sql`      |
| `catalog.pack_items` | sí      | SELECT público; CUD staff         | Lectura pública; escritura staff | `supabase/tests/catalog__pack_items.sql` |

## Boundaries y DTOs

| Boundary         | Tipo          | Input                   | Output DTO                                                                                    |
| ---------------- | ------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| `listPacks`      | Server Action | —                       | `{ id, sku, name, imageUrl, normalPrice, referencePrice, finalPrice, itemCount, isActive }[]` |
| `getPack`        | Server Action | `{ id }`                | FormDTO + items + reference/normal/final + campaign                                           |
| `createPack`     | Server Action | `createPackInputSchema` | `{ ok, id? }`                                                                                 |
| `updatePack`     | Server Action | `updatePackInputSchema` | `{ ok }`                                                                                      |
| `softDeletePack` | Server Action | `{ id }`                | `{ ok }`                                                                                      |

Formulario Combos (`pack-form`): carga productos con `listProducts({ status: "active" })`; al editar, `mergePackProductOptions` conserva ítems ya en la BOM. Persistencia solo productos activos (Regla 23 / `validatePackItems`).

> **Post-S4-04:** cada ítem lleva `packageQuantity` + `unitQuantity` (suma ≥ 1). Contrato canónico: [S4/04-pack-dual-quantities.md](../S4/04-pack-dual-quantities.md).

## Rules que aplican

- [`00-architecture`](../../rules/00-architecture.md)
- [`10-auth-and-authorization`](../../rules/10-auth-and-authorization.md)
- [`30-rls-and-postgres`](../../rules/30-rls-and-postgres.md)
- [`40-validation-and-boundaries`](../../rules/40-validation-and-boundaries.md)
- [`85-react-components`](../../rules/85-react-components.md)

## Criterios de aceptación

- [x] Migración + pgTAP packs/pack_items
- [x] Vitest `pack-price`, validations pack, check-order-stock pack
- [x] CRUD Combos en admin; `normal >= reference`
- [x] Orden admin con línea pack; deduct componentes al paid
- [x] `pnpm check` + build admin

> Ecommerce guest (`/combos`, carrito) → [S3A-05](../S3A/05-catalog-packs-ecommerce.md) (fuera de S1F).

## Referencias

- [database.md](../../database.md) § packs
- [DECISIONS.md](../../DECISIONS.md) #33
- [S4/04-pack-dual-quantities.md](../S4/04-pack-dual-quantities.md) — BOM dual (actual)
