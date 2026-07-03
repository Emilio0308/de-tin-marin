# 85 — Componentes React

> **Alcance:** Patrón container/presentational, estructura de archivos, orden interno y tests de render.
> **Aplica a:** `'use client'` y Server Components con sub-componentes locales.

## Patrón Container / Presentational

Cada feature UI se divide en:

| Rol                | Archivo                      | Responsabilidad                                                   |
| ------------------ | ---------------------------- | ----------------------------------------------------------------- |
| **Container**      | `product-list.container.tsx` | Datos, hooks (TanStack Query, Zustand, context), handlers, wiring |
| **Presentational** | `product-list.tsx`           | Solo UI: recibe props, emite eventos via callbacks                |

```text
components/
  product-list/
    product-list.container.tsx   # Container — export default o nombrado
    product-list.tsx             # Presentational — puro
    product-list.types.ts        # Interfaces y types del par
    product-list.helpers.ts      # Funciones puras (format, map, filter)
    product-list.test.tsx        # Test de render del presentational
```

**Reglas:**

- El **presentational** no importa repositories, actions ni clientes Supabase.
- El **container** no contiene markup complejo — delega al presentational.
- Si el componente es trivial (solo UI estática), puede ser un solo archivo sin container.

## Archivos colaterales (obligatorios cuando aplique)

| Archivo        | Contenido                        | Prohibido                     |
| -------------- | -------------------------------- | ----------------------------- |
| `*.types.ts`   | `interface`, `type`, props types | Lógica, JSX                   |
| `*.helpers.ts` | Funciones puras reutilizables    | Hooks, JSX, side effects      |
| `*.test.tsx`   | Test de render (presentational)  | Tests E2E (van en Playwright) |

Importar types y helpers por **ruta concreta** — nunca vía barrel.

## Sin `index.ts` ni barrels

**Prohibido** en componentes y en todo el repo:

```typescript
// ❌ components/product-list/index.ts
export { ProductList } from "./product-list";
export { ProductListContainer } from "./product-list.container";

// ❌ import desde barrel
import { ProductList } from "@/modules/products/components/product-list";

// ✅ import directo
import { ProductList } from "@/modules/products/components/product-list/product-list";
import { ProductListContainer } from "@/modules/products/components/product-list/product-list.container";
import type { ProductListProps } from "@/modules/products/components/product-list/product-list.types";
```

## Orden interno del archivo

Todo archivo de componente (container o presentational) sigue **este orden**:

```text
1. Imports
2. Hooks externos     — Redux, Zustand, Context, custom hooks (useCart, useQuery…)
3. Hooks de estado    — useState, useRef, useReducer, useMemo derivado de estado local
4. Lógica             — variables derivadas, constantes locales de render
5. Funciones          — handlers, helpers inline que no van en *.helpers.ts
6. useEffect          — todos los useEffect agrupados aquí
7. Componente(s)      — function Component / return JSX (presentational al final)
```

### Ejemplo (container)

```tsx
"use client";

// 1. Imports
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductList } from "./product-list";
import type { ProductListProps } from "./product-list.types";
import { mapProductsToRows } from "./product-list.helpers";

// 2. Hooks externos
export function ProductListContainer() {
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // 3. Hooks de estado
  const [filter, setFilter] = useState("");

  // 4. Lógica
  const rows = mapProductsToRows(data ?? [], filter);

  // 5. Funciones
  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  // 6. useEffect
  // (ninguno en este ejemplo)

  // 7. Componente
  return (
    <ProductList
      rows={rows}
      isLoading={isLoading}
      filter={filter}
      onFilterChange={handleFilterChange}
    />
  );
}
```

### Ejemplo (presentational)

```tsx
// 1. Imports
import type { ProductListProps } from "./product-list.types";

// 2–6. (vacío en presentational puro — sin hooks ni effects)

// 7. Componente
export function ProductList({
  rows,
  isLoading,
  filter,
  onFilterChange,
}: ProductListProps) {
  if (isLoading) return <p>Cargando…</p>;

  return (
    <div>
      <input value={filter} onChange={(e) => onFilterChange(e.target.value)} />
      <ul>
        {rows.map((row) => (
          <li key={row.id}>{row.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Test de render (obligatorio)

Cada **presentational** tiene `*.test.tsx` en la misma carpeta.

```tsx
// product-list.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProductList } from "./product-list";

describe("ProductList", () => {
  it("renderiza filas y el filtro", () => {
    render(
      <ProductList
        rows={[{ id: "1", name: "Gomitas" }]}
        isLoading={false}
        filter=""
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Gomitas")).toBeInTheDocument();
  });

  it("muestra estado de carga", () => {
    render(
      <ProductList rows={[]} isLoading filter="" onFilterChange={vi.fn()} />,
    );
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });
});
```

**Mínimo por componente:**

- Render happy path
- Un estado alternativo relevante (loading, empty, error) si aplica

Los containers se testean con mocks de hooks o tests de integración; el **render test** apunta al presentational.

## Server Components

Si el componente es Server Component (sin `'use client'`):

- No aplica orden de hooks de estado/effects (no hay hooks de React cliente).
- Orden simplificado: **Imports → lógica async/await → JSX**.
- El patrón container/presentational sigue siendo válido: container async en server, presentational como hijo recibiendo props serializables.

## Enforcement

| Regla                             | Tipo                     |
| --------------------------------- | ------------------------ |
| No barrels                        | Mecánico — ESLint (S0)   |
| `*.types.ts` / `*.helpers.ts`     | Convención + review      |
| Test de render por presentational | Convención + review + CI |
| Orden interno del archivo         | Convención + review      |

Ver también [`00-architecture.md`](00-architecture.md) · [`coding-guidelines.md`](../coding-guidelines.md).
