# Supabase — De Tin Marín

## Schemas expuestos (API)

Configurar en el dashboard de Supabase → **Settings → API → Exposed schemas**:

`core`, `catalog`, `pricing`, `commerce`, `crm`

## Local

```bash
supabase start
supabase db reset   # aplica migraciones + seed
```

## Migraciones

| Archivo                            | Contenido                         |
| ---------------------------------- | --------------------------------- |
| `00001_spine_schemas_and_core.sql` | Schemas + tablas `core.*` con RLS |

## Tests pgTAP

```bash
supabase test db
```

Archivos en `supabase/tests/`.

## Tipos TypeScript

```bash
supabase gen types typescript --local > packages/types/src/database.generated.ts
```
