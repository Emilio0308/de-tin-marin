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

## Manejo de errores y logging (obligatorio)

Regla: **nunca tragar un error en silencio.** Un error de Supabase/RLS o un
`throw` de repositorio que no se registra deja la terminal vacía y la UI con un
mensaje genérico inútil (lección S1A).

Servicio de logging/errores: `apps/admin/src/shared/errors/server-error.ts`.

- `getErrorMessage(error: unknown): string` — mensaje legible de cualquier valor.
- `logServerError(scope, error)` — `console.error` server-side con scope.
- `guardAction(scope, run)` — envuelve el cuerpo del Server Action.

### Reglas

1. **Toda Server Action** envuelve su cuerpo en `guardAction("scope", async () => { ... })`.
   Captura los `throw` (Supabase/RLS), los loguea y devuelve
   `{ ok: false, error: "UNEXPECTED", message }`.
2. **Helpers server-only** (p. ej. `requireStaff`) que descartan un resultado por
   error deben `logServerError(...)` antes de devolver el código de error.
3. **Nunca** `catch {}` vacío ni descartar `error` de una respuesta Supabase sin loguear.
4. El `message` de `UNEXPECTED` puede mostrarse en la UI del backoffice (herramienta
   interna) para depurar; no exponer detalles crudos en superficies públicas.

```typescript
export async function createCategoryAction(raw: unknown) {
  return guardAction("createCategoryAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await createCategoryService(supabaseConfig, raw);
    if (result.ok) revalidatePath("/categories");
    return result;
  });
}
```

> El servicio vive hoy en `apps/admin`. Si el ecommerce necesita el mismo patrón,
> promover a un paquete compartido antes de duplicarlo.

## Bug classes prevenidos

- Inyección / type confusion
- Mass assignment (campos extra ignorados por Zod)
- Crashes por shape incorrecto en runtime
- Errores silenciosos (terminal vacía + mensaje genérico en UI)
