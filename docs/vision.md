# Visión — De Tin Marín

## Qué es De Tin Marín

De Tin Marín es un **ecommerce especializado en dulces y sorpresas**, con:

- **Tienda pública** (`apps/ecommerce`) — catálogo, carrito, checkout, seguimiento de pedidos.
- **Backoffice administrativo** (`apps/admin`) — gestión de productos, bundles, campañas, inventario, órdenes, clientes y reportes.
- **Backend compartido** — Supabase + PostgreSQL, lógica en packages y módulos por dominio.

## Qué NO es

- No es una aplicación cuyo producto principal sea IA generativa.
- Es una aplicación **diseñada desde el inicio para ser desarrollada y mantenida con ayuda de IA** (Cursor, Claude Code, etc.).

## North star

1. **Modularidad por dominio** — cada bounded context es autocontenido y documentado.
2. **Contexto reducido para IA** — un agente carga solo el dominio que toca, no todo el repo.
3. **Reglas de negocio explícitas** — numeradas, testeables, cerca del código.
4. **Separación Pricing / Orders / Inventory** — una sola fuente de verdad por responsabilidad.
5. **Bundles como composición** — las sorpresas agrupan productos sin duplicarlos.

## Usuarios

| Actor           | Superficie | Capacidades                                            |
| --------------- | ---------- | ------------------------------------------------------ |
| **Cliente**     | ecommerce  | Comprar, ver pedidos, aplicar cupones                  |
| **Admin**       | admin      | CRUD catálogo, campañas, órdenes, inventario, reportes |
| **Super admin** | admin      | Usuarios, settings globales, overrides                 |

## Stack

Next.js · React · TypeScript · Tailwind CSS · shadcn/ui · Supabase · PostgreSQL · TanStack Query · Zod · Turborepo · pnpm · Vercel.

## Referencia

Guía original: [`Guia_Arquitectura_AI_First_Ecommerce.md`](../Guia_Arquitectura_AI_First_Ecommerce.md)
