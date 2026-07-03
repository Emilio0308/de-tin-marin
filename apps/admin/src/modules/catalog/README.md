# Catálogo — módulo admin

CRUD de categorías y productos en `apps/admin`.

## Capas

`actions/` → `services/` → `repositories/` → Supabase schema `catalog`

## Rutas

- `/categories` — listado
- `/categories/new` — crear
- `/categories/[id]/edit` — editar
- `/products` — listado
- `/products/new` — crear
- `/products/[id]/edit` — editar

## Auth staff

Requiere usuario en Supabase Auth + fila en `core.user_roles`.
