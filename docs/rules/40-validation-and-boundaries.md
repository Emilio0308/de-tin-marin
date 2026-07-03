# 40 — Validación y boundaries

> **Alcance:** Zod en cada frontera de confianza.

## Regla central: parse, don't validate

En cada boundary donde datos no confiables entran a código tipado:

1. Server Action args y `FormData`
2. Route Handler body y query
3. `params` / `searchParams` (await en Next 15+)
4. `process.env` — una vez al startup en `@de-tin-marin/config/env`
5. Respuestas Supabase
6. Respuestas `fetch` externas
7. `JSON.parse`

```typescript
const CreateProductInput = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  basePrice: z.number().nonnegative(),
  categoryId: z.string().uuid(),
});

export async function createProduct(raw: unknown) {
  const parsed = CreateProductInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() };
  }
  const data = parsed.data; // tipado, sin as-cast
}
```

## safeParse vs parse

- **safeParse** en boundaries externos (actions, routes) — devolver error tipado
- **parse** solo donde el throw está controlado

## Esquemas compartidos

Definir en `@de-tin-marin/validations`; re-exportar en módulo si hace falta contexto.

Tipos: `type X = z.infer<typeof XSchema>`.

## Env

```typescript
// packages/config/src/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: {/* ... */},
});
```

## Bug classes prevenidos

- Inyección / type confusion
- Mass assignment (campos extra ignorados por Zod)
- Crashes por shape incorrecto en runtime
