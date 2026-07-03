# S1C · Pricing — Campañas (fundación, sin uso operativo v1)

|                |                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Etapa**      | S1C — Pricing + Campaigns ([roadmap.md](../../roadmap.md) § S1C)                                                             |
| **Owner**      | Equipo De Tin Marín                                                                                                          |
| **App(s)**     | `packages/shared`, `packages/validations`, `apps/admin` (solo listado productos)                                             |
| **Schemas**    | `pricing`, `catalog` (FK en `products`)                                                                                      |
| **Depende de** | [S1A/01-catalog-products-categories.md](../S1A/01-catalog-products-categories.md), [S1B/01-bundles.md](../S1B/01-bundles.md) |
| **Estado**     | approved                                                                                                                     |

## Contexto (leer esto, no todo docs/)

- S1A ✅ — `catalog.products` con `prices` JSONB; listado admin devuelve `netPrice` desde `prices.normal`.
- S1B ✅ — bundles con precio dinámico desde `normal.netPrice` de componentes (sin campaña aún).
- Modelo acordado ([database.md](../../database.md), [campaigns.md](../../campaigns.md)): **1 producto ↔ 1 campaña** vía `catalog.products.campaign_id` → `pricing.campaigns`.
- **Invariante 9 / Regla 12** — el precio final se calcula en **backend**; el front recibe `finalPrice` listo, **nunca recalcula**.
- **DECISIONS #10, #18** — relación 1:1 producto↔campaña; listado incluye precio final desde backend.
- **Acotación v1 (esta sesión):** el esquema y el helper existen, pero **no habrá campañas activas ni UI admin** en v1. Sin asignaciones → `finalPrice === netPrice` siempre. La feature se activa en una etapa posterior sin cambiar el contrato de DTOs.

### Cálculo de `finalPrice` (contrato fijo)

```text
¿campaña vigente? (campaign_id + is_active + starts_at <= now <= ends_at)
  → sí: finalPrice = netPrice × (1 - percentage/100)
  → no: finalPrice = netPrice
```

El front/ecommerce solo muestra `finalPrice`. El admin de campañas (CRUD + asignar) queda **fuera de v1**.

## Objetivo

El monorepo tiene el esquema de campañas, el helper de precio final y los DTOs de producto exponen `finalPrice` calculado en backend; en v1 sin campañas asignadas, `finalPrice` coincide con `netPrice`.

## Scope IN

- Migración `00005_pricing_campaigns.sql` + pgTAP: `pricing.campaigns`, `catalog.products.campaign_id` (FK nullable), RLS staff, grants schema `pricing`
- Helper `computeFinalPrice({ netPrice, campaign })` en `@de-tin-marin/shared` + Vitest (sin campaña, vigente, expirada, inactiva)
- Extender `productListItemSchema` y DTOs admin con `finalPrice` (y opcional `campaign` null en v1)
- `listProductsService` / repository: LEFT JOIN campaña, aplicar helper, devolver `finalPrice`
- Docs: acotación en [campaigns.md](../../campaigns.md), [pricing.md](../../pricing.md), DECISIONS #23

## Scope OUT (traps)

- **NO UI admin de campañas** — CRUD campañas, asignar a producto → etapa posterior → _scope creep_
- **NO crear campañas de seed/demo** — tablas vacías en v1 → _feature activa sin operador_
- **NO recalcular en frontend** — solo consumir `finalPrice` → _invariante 9_
- **NO cupones / VIP / `price_rules`** → fuera de v1
- **NO aplicar campaña en bundles** — S1B sigue con `normal.netPrice`; integración bundle+campaña → cuando se active campañas
- **NO tocar Orders / snapshot** → S2B
- **NO `index.ts` barrels**

## Tablas y RLS

| Tabla (schema)      | ¿Nueva? | Ops                        | Política (prosa)                     | pgTAP                                   |
| ------------------- | ------- | -------------------------- | ------------------------------------ | --------------------------------------- |
| `pricing.campaigns` | sí      | SELECT staff; CUD staff    | Solo staff (`core.is_staff()`)       | `supabase/tests/pricing__campaigns.sql` |
| `catalog.products`  | alter   | + columna `campaign_id` FK | Sin cambio RLS producto; FK nullable | (cubierto en migración + pgTAP FK)      |

Grants: `GRANT USAGE ON SCHEMA pricing`; `GRANT SELECT ON pricing.campaigns TO anon, authenticated` (lectura pública no necesaria en v1 — solo staff asignará después; por consistencia con catálogo, SELECT staff-only vía RLS).

## Boundaries y DTOs

| Boundary       | Tipo    | Cambio v1                                                                                |
| -------------- | ------- | ---------------------------------------------------------------------------------------- |
| `listProducts` | Action  | Output item: `{ ..., netPrice, finalPrice, campaign: null \| { id, name, percentage } }` |
| (futuro)       | Actions | `createCampaign`, `assignCampaignToProduct`, etc. — **no implementar v1**                |

- `finalPrice` **siempre** calculado en service con `computeFinalPrice`.
- `campaign` en DTO solo si vigente; si no, `null`.

## Rules que aplican

- Invariantes **9, 12, 15** ([CLAUDE.md](../../../CLAUDE.md))
- [`rules/30-rls-and-postgres.md`](../../rules/30-rls-and-postgres.md)
- [`rules/40-validation-and-boundaries.md`](../../rules/40-validation-and-boundaries.md)

## Orden de implementación

1. Migración `00005` + pgTAP → `supabase db push` → `pnpm gen:db-types`
2. `computeFinalPrice` + tests
3. Extender product repository/service/DTOs con join campaña + `finalPrice`
4. Actualizar docs (campaigns, pricing, DECISIONS #23, roadmap)
5. `pnpm check` + `pnpm build`

## Criterios de aceptación

- [ ] `supabase db push` aplica `00005` sin error
- [ ] Vitest — `packages/shared/src/final-price.test.ts`: sin campaña, vigente 20%, expirada, inactiva
- [ ] pgTAP — `pricing__campaigns.sql`: RLS staff-only
- [ ] `listProducts` devuelve `finalPrice === netPrice` cuando no hay campañas (v1 operativo)
- [ ] Docs indican explícitamente: **campañas no en uso operativo v1**
- [ ] `pnpm check` + `pnpm build` verdes

## Preguntas abiertas

- Ninguna — v1 = fundación + DTO; activación operativa (admin CRUD campañas) diferida.

## Depends on

- [database.md](../../database.md) § `pricing.campaigns`, `products.campaign_id`
- [DECISIONS.md](../../DECISIONS.md) #10, #18
- [pricing.md](../../pricing.md), [campaigns.md](../../campaigns.md)
