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

Al agregar una variable nueva: schema + `runtimeEnv` + `.env.example` + **`turbo.json` → `tasks.build.env`** (si no, Vercel no la inyecta al build). Ver [`coding-guidelines.md`](../coding-guidelines.md) § Variables de entorno.

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

Regla: **nunca tragar un error en silencio.** Un error de Supabase/RLS, un `throw`
de repositorio, o un `Failed to fetch` (CORS) que no se registra deja la terminal /
Vercel vacíos y la UI con un mensaje genérico inútil (lección S1A + media upload).

Servicios:

| Helper                                               | Archivo                                        | Uso                                                             |
| ---------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| `getErrorMessage` / `logServerError` / `guardAction` | `apps/admin/src/shared/errors/server-error.ts` | Server Actions y código `server-only` → **Vercel Runtime Logs** |
| `getErrorMessage` / `logClientError`                 | `apps/admin/src/shared/errors/client-error.ts` | Containers `'use client'` → **consola del browser**             |

### Reglas

1. **Toda Server Action** envuelve su cuerpo en `guardAction("scope", async () => { ... })`.
   Captura los `throw` (Supabase/RLS), los loguea y devuelve
   `{ ok: false, error: "UNEXPECTED", message }`.
2. **Helpers server-only** (p. ej. `requireStaff`) que descartan un resultado por
   error deben `logServerError(...)` antes de devolver el código de error.
3. **Nunca** `catch {}` vacío ni `catch { setError(genérico) }` sin loguear.
   En client: `logClientError(scope, error)` y preferir mostrar `message` en el backoffice.
4. El `message` de `UNEXPECTED` puede mostrarse en la UI del backoffice (herramienta
   interna) para depurar; no exponer detalles crudos en superficies públicas.
5. **PUT a S3 desde el browser** (presign) no genera logs en Vercel si falla por CORS —
   solo en la consola del cliente (`putPresignedCatalogImage`). Si el presign sí
   corre, verás `console.info` del service en Runtime Logs.

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
