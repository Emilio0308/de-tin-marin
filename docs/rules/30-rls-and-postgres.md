# 30 — RLS y Postgres

> **Alcance:** Row Level Security como frontera de autorización.

## Principios

1. **RLS ENABLED** en toda tabla en schemas expuestos — no solo policies.
2. Un schema organiza; **no sustituye** seguridad.
3. `service_role` bypass RLS — solo server-side con checks de app.
4. Autorizar con claims verificados — **nunca `user_metadata`** (editable por usuario).

## Schemas expuestos

`core`, `catalog`, `pricing`, `commerce`, `inventory`, `crm`

Schema `private`: helpers `SECURITY DEFINER`, no expuesto a PostgREST.

## Posturas por dominio

| Dominio          | Lectura anon        | Lectura customer | Escritura             |
| ---------------- | ------------------- | ---------------- | --------------------- |
| products activos | ✅ catálogo público | ✅               | staff                 |
| orders           | ❌                  | propias          | server + staff        |
| inventory        | ❌                  | ❌               | staff + server deduct |
| coupons          | ❌                  | ❌               | staff                 |

## Funciones SECURITY DEFINER

Usar para:

- `inventory.deduct_for_order` — transacción atómica Regla 14
- `pricing.calculate_cart_total` — si se expone vía RPC

Siempre: `set search_path = ''`, permisos EXECUTE revocados a `anon` donde aplique.

## Migraciones

- Toda tabla nueva → RLS ON + al menos una policy en la misma migración
- Test pgTAP en el mismo stage que crea la tabla

## Advisors

Lint RLS con Supabase `get_advisors` / splinter — no confiar solo en review manual.

## Convenciones

- `deleted_at` para soft-delete
- `audit_log` en acciones sensibles (ajustes stock, cambios precio base)
