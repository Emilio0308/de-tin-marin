# S3A-05 · Catálogo público — Combos (packs)

|                |                                                                  |
| -------------- | ---------------------------------------------------------------- |
| **Etapa**      | S3A-05 — Combos ecommerce ([roadmap.md](../../roadmap.md) § S3A) |
| **Owner**      | Equipo De Tin Marín                                              |
| **App(s)**     | `apps/ecommerce`                                                 |
| **Schemas**    | `catalog` (lectura RLS pública)                                  |
| **Depende de** | S1F ✅, S3A-1…S3A-4 ✅                                           |
| **Estado**     | done                                                             |

## Contexto

- S1F ✅ — `catalog.packs` / `pack_items`; shared order-cart `type: pack`; deduct al `paid`.
- Ecommerce: tabs productos/sorpresas, carrito localStorage, checkout guest.
- Combo ≠ sorpresa: precio persistido, sin wizard, stock vía componentes.

## Objetivo

Visitante puede listar/ver combos, añadirlos al carrito (min/max), y completar checkout guest con snapshot pack congelado.

## Scope IN

- Tab `/?tab=combos` + `/combos/[slug]`
- Public catalog packs + cart/checkout/confirmación
- Docs/README actualizados

## Scope OUT

- Wizard / editar BOM · stock propio · cambios admin

## Criterios

- [x] Listado/detalle con `finalPrice`
- [x] Add-to-cart merge por packId
- [x] Guest order con `type: pack` + stock check
- [x] typecheck + build ecommerce
