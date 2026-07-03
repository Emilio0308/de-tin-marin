# Catálogo — módulo admin

CRUD de categorías, productos y paquetes en `apps/admin`.

## Capas

`actions/` → `services/` → `repositories/` → Supabase schema `catalog`

## Rutas

- `/categories` — listado
- `/categories/new` — crear
- `/categories/[id]/edit` — editar
- `/products` — listado
- `/products/new` — crear
- `/products/[id]/edit` — editar
- `/bundles` — listado de paquetes
- `/bundles/new` — crear paquete
- `/bundles/[id]/edit` — editar paquete

## Auth staff

Requiere usuario en Supabase Auth + fila en `core.user_roles`.
