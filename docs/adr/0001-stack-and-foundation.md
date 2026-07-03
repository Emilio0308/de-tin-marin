# ADR 0001 — Stack y fundación

- **Estado:** Aceptado
- **Fecha:** 2026-07-02
- **Contexto:** Greenfield ecommerce de dulces y sorpresas, AI-first development.

## Decisiones

### Monorepo — Turborepo + pnpm

Dos apps (`ecommerce`, `admin`) y packages compartidos. Yarn/npm posibles pero **pnpm** es el estándar del proyecto.

### Framework — Next.js App Router

- Server Components por defecto
- Server Actions para mutaciones in-app
- Route Handlers `/api/v1` para webhooks

### Lenguaje — TypeScript strict

`strict: true`. Evaluar flags extra (`noUncheckedIndexedAccess`, etc.) en S0.

### Estilos — Tailwind + shadcn/ui

Componentes compartidos en `@de-tin-marin/ui`.

### Backend — Supabase

- Postgres + Auth + RLS
- Migraciones en `supabase/migrations/`
- Tipos generados → `@de-tin-marin/types`

### Validación — Zod

Esquemas en `@de-tin-marin/validations` y por módulo. `z.infer` para tipos.

### Estado cliente — TanStack Query

Para catálogo, carrito, listados admin.

### Deploy — Vercel

Un proyecto por app o monorepo con filtros turbo.

### Desarrollo asistido por IA

- `CLAUDE.md` — compatibilidad Claude Code / otros
- `AGENTS.md` — Cursor
- Docs por dominio + stage briefs

## Consecuencias

- El repo arranca como "carcasa documentada" hasta S0
- Toda feature nueva requiere brief o actualización de docs
- RLS obligatorio antes de datos reales en producción

## Alternativas consideradas

| Alternativa                  | Por qué no (v1)                                       |
| ---------------------------- | ----------------------------------------------------- |
| tRPC (como ADMIN_BACKOFFICE) | Server Actions + Supabase suficientes; menos capas    |
| Un solo app con route groups | Dos apps separan contexto y deploy de tienda vs admin |
