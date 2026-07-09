# S3A-1-R · Remediación — paginación y orden en catálogo público

|                    |                                                                     |
| ------------------ | ------------------------------------------------------------------- |
| **Tipo**           | Defecto de implementación (no deuda técnica opcional)               |
| **Severidad**      | Alta                                                                |
| **Introducido en** | S3A-1 · Catálogo público (`01-catalog-products-bundles.md`)         |
| **Estado**         | Abierto — documentado; corrección diferida para no bloquear roadmap |
| **App(s)**         | `apps/ecommerce`                                                    |
| **Bloquea**        | Calidad/escala del catálogo; no bloquea S3A-2…4 funcionalmente      |

## Resumen ejecutivo

La paginación y el ordenamiento del catálogo público (`/productos`, `/sorpresas`) **no se ejecutan en la base de datos**. Los repositorios cargan **todo el conjunto filtrado** y el service ordena y pagina **en memoria del servidor Node**.

Eso contradice el contrato funcional de listados paginados: el límite `pageSize` no reduce trabajo en DB ni transferencia de red hacia el backend. En v1 con pocos SKUs puede pasar desapercibido; **no es una implementación aceptable** para un ecommerce, aunque sea la primera versión.

> **Aclaración:** no es paginación en el **cliente** (navegador). TanStack Query llama Server Actions y el slice ocurre en `public-catalog.service.ts`. El defecto es **paginación/orden en memoria tras un full scan SQL**.

---

## Comportamiento actual

### Flujo productos

```
UI (/productos)
  → listPublicProductsAction
  → listPublicProductsService
  → listPublicProductsRepo     ← SELECT sin LIMIT/OFFSET; trae TODAS las filas activas
  → map (finalPrice, stockDisplay, …)
  → sortPublicProducts         ← sort en memoria (packages/validations)
  → paginateItems              ← slice en memoria
  → { items, page, pageSize, total }
```

### Flujo bundles

```
UI (/sorpresas)
  → listPublicBundlesAction
  → listPublicBundlesService
  → listPublicBundlesRepo      ← SELECT sin LIMIT; trae TODOS los bundles activos
  → listPublicBundleItemsByBundleIdsRepo  ← items de TODOS los bundles de la página lógica (hoy: todos)
  → getActiveContainersByIdsRepo
  → map + computeBundleTotal por fila
  → sortPublicBundles
  → paginateItems
```

### Archivos implicados

| Archivo                                                                 | Rol del defecto                                                       |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `apps/ecommerce/src/modules/catalog/repositories/product.repository.ts` | `listPublicProductsRepo` sin `range`, sin `count`, sin `order` SQL    |
| `apps/ecommerce/src/modules/catalog/repositories/bundle.repository.ts`  | `listPublicBundlesRepo` idem                                          |
| `apps/ecommerce/src/modules/catalog/services/public-catalog.service.ts` | `sortPublicProducts`, `sortPublicBundles`, `paginateItems` en memoria |
| `packages/validations/src/public-catalog.ts`                            | Helpers `paginateItems`, `sortPublic*` usados en producción           |

### Fragmento representativo

```typescript
// public-catalog.service.ts — listPublicProductsService
const rows = await listPublicProductsRepo(config, { categoryId, search });
const mapped = rows.map(toProductListItem);
const sorted = sortPublicProducts(mapped, sort);
return { ok: true, data: paginateItems(sorted, page, pageSize) };
```

```typescript
// product.repository.ts — sin paginación SQL
const { data, error } = await query; // sin .range(), sin count head
return (data ?? []) as unknown as PublicProductRow[];
```

---

## Por qué es un defecto grave

| Riesgo                                    | Impacto                                                                                                              |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Crecimiento del catálogo**              | Latencia y memoria O(n) por request; timeouts en Server Actions                                                      |
| **Coste Supabase**                        | Más filas leídas y payload JSON innecesario en cada listado                                                          |
| **Orden por precio incorrecto en escala** | Orden en app debe coincidir con SQL; hoy es coherente solo porque se ordena el mismo array completo                  |
| **Bundles**                               | Peor caso: N bundles × M items × precios JSON; cálculo `computeBundleTotal` para filas que nunca se mostrarán        |
| **Expectativa del brief S3A-1**           | Pide `page` + `pageSize` y controles de paginación; la UI cumple, pero el backend no honra el contrato de eficiencia |
| **Criterio “página 2 no repite ítems”**   | Se cumple por el slice en memoria, no porque la paginación sea correcta en origen                                    |

El brief S3A-1 mencionaba explícitamente _“Si paginación en SQL compleja → vista/RPC opcional”_. Eso autorizaba **diferir la solución**, no **omitir paginación real**. Tratarlo como “v1 válido” fue un atajo incorrecto.

---

## Qué no hay que confundir

- **Correcto:** DTO `finalPrice` y `total` calculados en **service** (reglas 8, 9; DECISIONS #6, #18).
- **Incorrecto:** Traer todas las filas para luego descartar las que no entran en la página.
- **Correcto:** Filtros `is_active`, `deleted_at`, `categoryId`, `search` en SQL (ya están en repo).
- **Incorrecto:** `listPublicCategoriesService` sin paginación (categorías son pocas; aceptable).

---

## Opciones de solución

### A. Productos — paginación SQL nativa (recomendada, prioridad 1)

**Idea:** `COUNT` + `SELECT … ORDER BY … LIMIT/OFFSET` (Supabase `.range(from, to)`) en el repository; el service solo mapea el page actual a DTO.

| Sort                       | En SQL                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `name_asc` / `name_desc`   | `.order('name', { ascending })`                                                                                |
| `price_asc` / `price_desc` | Orden sobre expresión JSON `prices` (v1 sin campañas: `normal.netPrice` alineado con `parseProductPricesJson`) |

**Pros**

- Sin migración obligatoria
- Mismo patrón que el resto del monorepo (PostgREST + RLS)
- `pageSize` limita filas leídas de verdad

**Contras**

- Orden por precio en JSON es más frágil que columna tipada; hay que documentar la expresión y testear paridad con `computeFinalPrice(packageNetPrice, null)`
- Cuando existan campañas activas (S1C operativo), el orden por precio en SQL requerirá join a `pricing.campaigns` o columna denormalizada

**Cambios típicos**

1. `countPublicProductsRepo(filters) → number`
2. `listPublicProductsRepo(filters, { page, pageSize, sort }) → PublicProductRow[]`
3. `listPublicProductsService` deja de llamar `sortPublicProducts` / `paginateItems` en el path feliz
4. Tests: integración o contrato repo (misma página no se solapa; total coherente con count)

---

### B. Productos — RPC Postgres `list_public_products`

**Idea:** Función `catalog.list_public_products(p_page, p_page_size, p_category_id, p_search, p_sort)` que devuelve `(rows, total_count)` con orden y filtros en SQL.

**Pros**

- Orden por precio complejo (JSON, futuras campañas) en un solo lugar
- Contrato estable para ecommerce y tests
- RLS se aplica si la función es `SECURITY INVOKER` y respeta políticas

**Contras**

- Requiere migración + pgTAP
- Duplica lógica de precio si no reutiliza la misma expresión que TypeScript
- Más pesado que opción A para el caso v1 sin campañas

**Cuándo elegirla:** si la opción A no logra paridad de `finalPrice` con campañas activas sin duplicar reglas.

---

### C. Bundles — RPC Postgres `list_public_bundles` (recomendada, prioridad 2)

**Idea:** El precio listado **no existe en `catalog.bundles`**. Hoy se calcula con:

- `surprise_containers.prices` (netPrice envase)
- `bundle_items` + `products.prices` (unitNetPrice × units_per_person)
- `computeBundleTotal` en `@de-tin-marin/shared/bundle-price`

La paginación SQL honesta casi obliga a una **RPC o vista** que:

1. Filtre bundles activos + búsqueda por nombre
2. Calcule `total` por fila con la misma fórmula que el admin (`bundle.service.ts`)
3. Ordene por `name` o `total`
4. Aplique `LIMIT/OFFSET` y devuelva `total_count`

**Pros**

- Una query paginada; items de bundle solo para la página actual (o calculados en la RPC)
- Paridad explícita con admin listado

**Contras**

- Migración + tests pgTAP obligatorios
- Mantener sincronía RPC ↔ `computeBundleTotal` (tests compartidos o SQL que llame lógica documentada)
- Más esfuerzo que productos

**Alternativa intermedia (no recomendada como solución final):**

- Paginar solo por `name` en SQL y seguir calculando precio en service **solo para la página** — reduce memoria pero el orden `price_*` seguiría siendo incorrecto sin ver todos los totales. **No cumple** el sort por precio del brief.

---

### D. Denormalización — columnas `list_price` / `computed_total`

**Idea:** Columna materializada actualizada en admin al guardar producto/bundle; el listado público ordena y pagina por columna escalar.

**Pros**

- Listados SQL triviales y rápidos

**Contras**

- Riesgo de desincronización stock/precio/campaña
- Triggers o jobs de refresco; fuera de scope S3A-1
- No resuelve stock display ni DTO completo sin joins

**Cuándo:** catálogo muy grande y RPC demasiado costosa en lectura (fase de optimización, no primera remediación).

---

## Plan de remediación recomendado

Orden sugerido para no bloquear S3A-2…4 del roadmap, pero **antes de producción con catálogo real grande**:

| Fase   | Entrega                                                                                                                           | Esfuerzo estimado |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **R1** | Productos: count + range + order SQL (opción A)                                                                                   | 0.5–1 día         |
| **R2** | Bundles: RPC `list_public_bundles` (opción C)                                                                                     | 1–2 días          |
| **R3** | Retirar `paginateItems` / `sortPublic*` del path de producción; mantener en tests unitarios de contrato o eliminar si redundantes | 0.5 día           |
| **R4** | Tests: Vitest repo/service + ampliar Playwright (página 2 distinta con dataset seed)                                              | 0.5 día           |

**Etiqueta sugerida en roadmap:** `S3A-1-R` (remediación) o ticket paralelo inmediatamente después de cerrar la etapa S3A en curso.

---

## Criterios de aceptación de la remediación

- [ ] `listPublicProductsRepo` no devuelve más filas que `pageSize` (salvo count query separada).
- [ ] `total` proviene de `COUNT(*)` con los mismos filtros, no de `array.length` en memoria.
- [ ] Orden `name_*` y `price_*` coincide con el listado admin para una muestra de productos activos.
- [ ] `listPublicBundles` idem; `total` de bundle = `computeBundleTotal` admin para la misma plantilla.
- [ ] Página 2 no repite IDs de página 1 **con datos reales en DB** (no solo array mock).
- [ ] Sin regresión en DTO allowlist ni en RLS público.
- [ ] `pnpm check` + `pnpm build` verdes.

---

## Impacto en etapas siguientes del roadmap

| Etapa                                          | ¿Puede continuar sin R1/R2?                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| **S3A-2** Wizard                               | Sí — usa detalle bundle y picker de productos; no depende del listado paginado global |
| **S3A-3** Carrito/checkout                     | Sí                                                                                    |
| **S3A-4** Guest orders                         | Sí                                                                                    |
| **Producción / marketing con catálogo amplio** | **No** — corregir R1 antes de lanzar                                                  |

---

## Referencias

- Brief original: [01-catalog-products-bundles.md](./01-catalog-products-bundles.md)
- Reglas precio: [business-rules.md](../../business-rules.md) § 3, 4, 8, 9
- Admin referencia bundles: `apps/admin/src/modules/catalog/services/bundle.service.ts` → `toListItem` + `computeBundleTotal`
- Helpers compartidos: `@de-tin-marin/shared/bundle-price`, `@de-tin-marin/shared/final-price`, `@de-tin-marin/shared/product-stock`

---

## Historial

| Fecha      | Nota                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------- |
| 2026-07-07 | Documento creado tras revisión post S3A-1; corrección diferida para continuar roadmap S3A |
