# 00 — Arquitectura y capas

> **Alcance:** Topología de módulos, DAL (Data Access Layer), dirección de imports.
> **Estado:** Forward-looking — el código aún no existe; los sketches son la forma objetivo.

## Reglas

### Co-location por feature

Cada dominio posee **todo** bajo `src/modules/<dominio>/`:

```text
actions/        # 'use server'
services/       # authz + orquestación + DTOs
repositories/   # ÚNICO lugar con queries Supabase
schemas/        # Zod
types/          # DTOs
components/     # UI — ver 85-react-components (container / presentational)
```

Estructura típica de un componente con lógica:

```text
components/product-list/
  product-list.container.tsx
  product-list.tsx
  product-list.types.ts
  product-list.helpers.ts
  product-list.test.tsx
```

`src/shared/` solo para infraestructura cross-feature: `config/env`, clientes Supabase, primitivos UI.

**Duplicar antes de acoplar** — promover a `packages/` solo con necesidad probada.

### DAL = repositories + services

Solo el DAL puede:

- Importar cliente Supabase
- Leer secrets de `process.env` (vía `@de-tin-marin/config/env`)
- Verificar ownership / permisos
- Construir DTOs que cruzan al cliente

Todo módulo DAL: `import "server-only"`.

`app/` (routes, pages) es **thin** — llama actions o services, nunca Supabase directo.

### Dirección de dependencias

```text
UI → Server Action → Service → Repository → Supabase

Variante pública:
/api/v1 → Service → Repository → Supabase
```

Nunca invertir: Repository no importa Service; Service no importa Action.

**Decisión:** mutación in-app autenticada → Server Action. Webhook o acceso anónimo HTTP → Route Handler.

### Sin barrel files — nunca `index.ts`

**Prohibido** crear `index.ts` que re-exporte. Importar siempre el archivo concreto (servicios, componentes, types, helpers):

```typescript
import { getProduct } from "@/modules/products/services/product.service";
import { ProductList } from "@/modules/products/components/product-list/product-list";
import type { ProductListProps } from "@/modules/products/components/product-list/product-list.types";

// ❌ import { getProduct } from "@/modules/products";
// ❌ import { ProductList } from "@/modules/products/components/product-list";
```

### `'use client'` en hojas

Default Server Components. Client solo donde hay estado, effects o event handlers. Server UI como `children`.

## Enforcement

| Regla           | Cómo                                                     |
| --------------- | -------------------------------------------------------- |
| DAL server-only | `import "server-only"` → falla build si llega al cliente |
| UI → repo       | ESLint `no-restricted-paths` (S0)                        |
| No barrels      | ESLint `no-restricted-imports` (S0)                      |

Ver [`95-guardrails-lint-ci.md`](95-guardrails-lint-ci.md).
