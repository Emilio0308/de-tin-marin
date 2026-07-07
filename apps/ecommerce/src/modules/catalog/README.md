# Módulo `catalog`

Catálogo público de productos y sorpresas (S3A-1).

## Estructura

- `repositories/` — lectura Supabase (anon + RLS público)
- `services/public-catalog.service.ts` — DTOs, precios, paginación
- `actions/` — Server Actions sin `requireStaff`
- `components/` — páginas de listado y detalle

## Actions

| Action                       | Descripción                                    |
| ---------------------------- | ---------------------------------------------- |
| `listPublicProductsAction`   | Productos activos con filtros y paginación     |
| `listPublicBundlesAction`    | Bundles activos con total `computeBundleTotal` |
| `listPublicCategoriesAction` | Categorías para filtro                         |
| `getPublicProductAction`     | Detalle por `slug` o `id`                      |
| `getPublicBundleAction`      | Detalle por `id`                               |

## Rutas

- `/productos` — listado
- `/productos/[slug]` — detalle producto
- `/sorpresas` — listado bundles
- `/sorpresas/[id]` — detalle plantilla
- `/sorpresas/[id]/personalizar` — wizard personalización (S3A-2)
