# Arquitectura — De Tin Marín

## Monorepo

```text
de-tin-marin/
  apps/
    ecommerce/          # Tienda pública
    admin/              # Backoffice
  packages/
    ui/                 # Componentes shadcn/ui compartidos
    db/                 # Clientes Supabase, helpers
    shared/             # Utilidades cross-feature
    types/              # Tipos TypeScript compartidos
    services/           # Servicios compartidos (si aplica)
    validations/        # Esquemas Zod compartidos
    config/             # Env validado, presets ESLint/TS
    ai/                 # Contexto y utilidades para desarrollo con IA
  supabase/
    migrations/
    seed/
  docs/
```

## Principios

1. **Arquitectura por dominios** — no por capas técnicas globales.
2. **Archivos pequeños** — 150–300 líneas cuando sea posible.
3. **Documentación cercana al código** — README, RULES, API, SCHEMA por dominio.
4. **Reglas de negocio explícitas** — ver [`business-rules.md`](business-rules.md).
5. **Tipos y validaciones compartidas** — Zod en `packages/validations`, tipos inferidos.

## Dominios

| Dominio       | Responsabilidad principal                                         |
| ------------- | ----------------------------------------------------------------- |
| Products      | CRUD, SKU, categorías, imágenes, `prices` JSONB, `stock_quantity` |
| Bundles       | Plantillas sorpresa sin stock; `service_fee` editable             |
| Pricing       | `finalPrice` en listado; total línea sorpresa                     |
| Campaigns     | Campañas %; asignación 1:1 a producto                             |
| Orders        | Ciclo de vida; snapshot; personalización bundle                   |
| Inventory     | Stock v1 en products; deduct al `paid`                            |
| Customers     | Perfiles de cliente (sin VIP v1)                                  |
| Payments      | Registro manual; operador confirma                                |
| Shipping      | Envíos, tracking                                                  |
| Notifications | Email (futuro)                                                    |
| Reports       | Métricas y exportaciones                                          |
| Users         | Staff del admin, roles                                            |
| Settings      | Configuración global                                              |

## Estructura de un dominio

```text
src/modules/<dominio>/
  actions/        # 'use server' — entrypoints
  services/       # Orquestación, authz, DTO shaping
  repositories/   # ÚNICO lugar con queries Supabase
  schemas/        # Zod del dominio
  types/          # DTOs, branded IDs
  components/     # UI del dominio (Server por defecto)
  hooks/          # TanStack Query hooks (client leaves)
  tests/
  README.md
  RULES.md
  API.md
  SCHEMA.md
```

Componentes con lógica siguen el patrón container/presentational — ver [`rules/85-react-components.md`](rules/85-react-components.md):

```text
components/<nombre>/
  <nombre>.container.tsx
  <nombre>.tsx
  <nombre>.types.ts
  <nombre>.helpers.ts
  <nombre>.test.tsx
```

## Capas y flujo de datos

```text
UI (RSC / client islands)
  ↓
Server Action  (mutaciones y reads autenticados in-app)
  ↓
Service        (authz + reglas de negocio + DTO)
  ↓
Repository     (queries Supabase)
  ↓
PostgreSQL + RLS
```

**Variante pública** (webhooks, lecturas anónimas si aplica):

```text
/api/v1/<route> → Service → Repository → Supabase
```

Reglas detalladas: [`rules/00-architecture.md`](rules/00-architecture.md).

## Schemas Postgres (v1)

| Schema      | Contenido                                                                      |
| ----------- | ------------------------------------------------------------------------------ |
| `core`      | staff, settings, audit_log                                                     |
| `catalog`   | products (`prices` JSONB, `stock_quantity`), bundles, bundle_items, categories |
| `pricing`   | campaigns (+ `products.campaign_id` 1:1)                                       |
| `commerce`  | orders, order_items, order_bundle_items, payments, shipments                   |
| `crm`       | customers                                                                      |
| `inventory` | ⏸ v2 — ledger de movimientos                                                   |

Moneda: **PEN** únicamente. Catálogo completo: [`database.md`](database.md).

## Apps

### ecommerce

- Catálogo público y autenticado (cliente).
- Carrito, checkout, historial de pedidos.
- Consume dominios: Products, Bundles, Pricing, Orders, Customers, Payments, Shipping.

### admin

- Panel para staff.
- CRUD de todos los dominios operativos.
- Roles: `admin`, `super_admin` (definir en [`DECISIONS.md`](DECISIONS.md)).

## Paquetes compartidos

| Package                     | Rol                                          |
| --------------------------- | -------------------------------------------- |
| `@de-tin-marin/ui`          | Design system (shadcn/ui)                    |
| `@de-tin-marin/db`          | Factories Supabase (server, anon, admin)     |
| `@de-tin-marin/validations` | Esquemas Zod compartidos                     |
| `@de-tin-marin/types`       | Tipos generados + DTOs base                  |
| `@de-tin-marin/config`      | `env.ts` validado con `@t3-oss/env-nextjs`   |
| `@de-tin-marin/shared`      | Helpers puros (format, ids)                  |
| `@de-tin-marin/ai`          | Prompts de contexto para desarrollo asistido |

## AI Context (desarrollo)

La IA debe cargar **únicamente**:

1. `CLAUDE.md` o `AGENTS.md`
2. Brief de etapa (si existe)
3. Docs del dominio (`docs/<dominio>.md` + módulo `README/RULES/API/SCHEMA`)
4. Rules aplicables (`docs/rules/`)

No cargar blueprints completos si un stage brief ya tiene los hechos load-bearing inline.
