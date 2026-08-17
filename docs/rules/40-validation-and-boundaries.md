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

**Sink v1 (DECISIONS #37):** solo consola del servidor (`console.info` / `warn` /
`error` → JSON en una línea). Visible en `pnpm dev:*` y **Vercel → Runtime Logs**.
Sin persistencia en DB, archivos ni servicios externos.

Implementación canónica: **`@de-tin-marin/logging`**
([README del package](../../packages/logging/README.md)). Shims por app:

| Helper                                                                                 | Origen                                                                                                         | Uso                                                       |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `guardAction` / `withOperation` / `logServerError` / `logServerInfo` / `logServerWarn` | `apps/<app>/src/shared/errors/server-error.ts` → `createServerErrorHelpers({ app, includeUnexpectedMessage })` | Server Actions y código `server-only`                     |
| `logClientError`                                                                       | `apps/admin/src/shared/errors/client-error.ts`                                                                 | Containers `'use client'` admin → **consola del browser** |

Config del shim:

| App       | `app`         | `includeUnexpectedMessage`                                 |
| --------- | ------------- | ---------------------------------------------------------- |
| admin     | `"admin"`     | `true` — `UNEXPECTED` puede llevar `message` al backoffice |
| ecommerce | `"ecommerce"` | `false` — `UNEXPECTED` **sin** detalle interno al cliente  |

### Eventos de operación

Toda Server Action (y Route Handler futuro) pasa por `guardAction("scope", run)`
(alias de `withOperation` sin meta extra):

1. `started` — al entrar (`requestId` de 8 chars, `app`, `scope`, `meta` opcional)
2. `completed` — al devolver `{ ok }` (`durationMs`, `errorCode` si `ok === false`)
3. `failed` — si hay `throw` (`errorCode: "UNEXPECTED"`) + `logger.error` con el error

Errores de negocio `{ ok: false, error: "VALIDATION" | … }` **también** dejan rastro
vía `completed` + `errorCode` (no solo los throws).

Forma del evento (campos relevantes):

```text
{ ts, level, app, scope, event?, requestId?, durationMs?, ok?, errorCode?, message?, meta? }
```

### Metadata segura (obligatorio)

Loguear **resumen**: IDs, conteos, códigos, status, duración. **Prohibido** loguear:

- payloads `raw` / body / FormData completos
- PII: `contact`, email, teléfono, dirección, `mapPin`, `fulfillment`
- secrets / cookies / tokens / URLs firmadas (`uploadUrl`, `signedUrl`)
- `shopping_cart` completo o issues Zod crudos (`issues`)

`safeMeta` (`@de-tin-marin/logging/redact`) aplica denylist + truncado. Preferir
pasar solo campos allowlisted a `logServerInfo` / `withOperation`.

### Reglas

1. **Toda Server Action** envuelve su cuerpo en `guardAction("scope", async () => { ... })`.
2. **Mutaciones críticas** (checkout, pagos, stock, media, create order) añaden
   `logServerInfo` / `logServerError` (y `logServerWarn` si aplica) en el **service**
   con meta segura, además del wrapper de la action.
3. **Helpers server-only** (p. ej. `requireStaff`, `bumpCatalogVersionSafe`) que
   descartan un resultado por error deben `logServerError(...)` antes de devolver
   el código de error.
4. **Nunca** `catch {}` vacío ni `catch { setError(genérico) }` sin loguear.
   En client admin: `logClientError(scope, error)`.
5. **UNEXPECTED al cliente:** admin puede incluir `message` acotado (backoffice);
   ecommerce **no** expone mensaje interno de Supabase/stack.
6. **PUT a S3 desde el browser** (presign) no genera logs en Vercel si falla por CORS —
   solo en la consola del cliente (`putPresignedCatalogImage`).
7. **Notificaciones SMTP:** al ejecutar trabajo best-effort post-respuesta,
   loguear solo `orderId`, `orderNumber`, origen, conteo `sent` y código de
   fallo. Nunca el input de correo (contacto, líneas, dirección, URLs guest),
   destinatarios ni valores `SMTP_*`.

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

Al diseñar una feature nueva: incluir logging de operación desde el brief —
no es un afterthought.

## Bug classes prevenidos

- Inyección / type confusion
- Mass assignment (campos extra ignorados por Zod)
- Crashes por shape incorrecto en runtime
- Errores silenciosos (terminal vacía + mensaje genérico en UI)
- Fuga de PII/secrets o detalles internos de DB al cliente / a logs
