# De Tin Marín

Ecommerce de dulces y sorpresas — monorepo AI-first.

## Requisitos

- Node.js >= 20.11
- pnpm 10+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (opcional, para BD local)

## Inicio rápido

```bash
pnpm install
cp .env.example .env.local
# Editar .env.local con valores de `supabase start` o tu proyecto remoto

pnpm dev              # ambas apps
pnpm dev:ecommerce    # http://localhost:3000
pnpm dev:admin        # http://localhost:3001
```

## Scripts

| Comando      | Descripción                                                           |
| ------------ | --------------------------------------------------------------------- |
| `pnpm check` | typecheck + lint + format + test                                      |
| `pnpm build` | build de producción (requiere `.env.local` o `SKIP_ENV_VALIDATION=1`) |
| `pnpm test`  | Vitest                                                                |
| `pnpm e2e`   | Playwright smoke (levanta dev servers)                                |

## Estructura

```text
apps/ecommerce/     Tienda pública (:3000)
apps/admin/         Backoffice (:3001)
packages/           @de-tin-marin/*
docs/               Documentación canónica
supabase/           Migraciones y tests pgTAP
```

## Documentación

- Agentes IA: [`AGENTS.md`](AGENTS.md) · [`CLAUDE.md`](CLAUDE.md)
- Arquitectura: [`docs/architecture.md`](docs/architecture.md)
- Brief S0: [`docs/stages/S0/01-monorepo-foundation.md`](docs/stages/S0/01-monorepo-foundation.md)

## Supabase local

```bash
supabase start
supabase db reset
```

Ver [`supabase/README.md`](supabase/README.md).

## Build sin credenciales reales

```bash
SKIP_ENV_VALIDATION=1 pnpm build
```
