# DECISIONS — Ledger de decisiones De Tin Marín

> **Precedencia:** donde una decisión aquí contradice otro doc, **este ledger gana**. Actualizar docs afectados al resolver cada ítem.
>
> **Firmado:** 2026-07-02 — Paso 1 completado.

| #   | Tema                      | Estado | Resolución                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Monorepo                  | ✅     | pnpm + Turborepo; apps `ecommerce` + `admin`                                                                                                                                                                                                                                                                                                                                                                                  |
| 2   | Auth boundary             | ✅     | Supabase Auth; RLS como frontera real                                                                                                                                                                                                                                                                                                                                                                                         |
| 3   | API layer                 | ✅     | Server Actions (in-app); `/api/v1` reservado para futuro                                                                                                                                                                                                                                                                                                                                                                      |
| 4   | Pricing vs Orders         | ✅     | Precios calculados en backend al listar/crear orden; Orders congela snapshot — nunca recalcula post-checkout                                                                                                                                                                                                                                                                                                                  |
| 5   | Stock de bundles          | ✅     | **Sin stock.** Bundles/sorpresas son plantillas por demanda; solo productos tienen stock                                                                                                                                                                                                                                                                                                                                      |
| 6   | Precio de bundles         | ✅     | **Dinámico, NO persistido.** `total = service_fee + quantity × Σ(precio_unitario × units_per_person)` donde precio unitario = `prices.unit.netPrice` (post-S1D). Sin columna `prices` en `bundles`; si un producto cambia de precio, el bundle se recalcula solo                                                                                                                                                              |
| 7   | Moneda                    | ✅     | **Solo PEN (soles peruanos).** `currency_code = 'PEN'` en todo el sistema                                                                                                                                                                                                                                                                                                                                                     |
| 8   | Pasarela de pago          | ✅     | **No en v1.** Pagos internos; operador confirma manualmente. Tabla `commerce.payments` sí existe                                                                                                                                                                                                                                                                                                                              |
| 9   | Cancelación / reembolso   | ✅     | **Manual por operador** en v1 (cambio de estado + reversión de stock manual si aplica)                                                                                                                                                                                                                                                                                                                                        |
| 10  | Campañas por producto     | ✅     | **Relación 1:1** producto↔campaña. Al asignar nueva, se reemplaza la anterior. Sin campaña → `prices.normal`                                                                                                                                                                                                                                                                                                                  |
| 11  | Puertos dev               | ✅     | ecommerce **3000**, admin **3001**                                                                                                                                                                                                                                                                                                                                                                                            |
| 12  | Asistente IA principal    | ✅     | Cursor (`AGENTS.md`); `CLAUDE.md` para compatibilidad                                                                                                                                                                                                                                                                                                                                                                         |
| 13  | Estructura de precios     | ✅     | JSONB `prices` en producto (opción A). v1: **`normal`** (presentación) + **`unit`** (unidad base) con `netPrice`, `igv`, `subtotal`. Futuro: `suggested`, `fantasy`. Ver #28                                                                                                                                                                                                                                                  |
| 14  | IGV                       | ✅     | `netPrice` = **precio final al cliente (IGV incluido).** Desglose: `subtotal` + `igv` = `netPrice`                                                                                                                                                                                                                                                                                                                            |
| 15  | Stock v1                  | ✅     | **`stock_sealed_packages` + `stock_loose_base_units`** en `catalog.products` (DECISIONS #29). Schema `inventory` y ledger de movimientos → **v2**. ~~`stock_quantity`~~ eliminada en S1D                                                                                                                                                                                                                                      |
| 16  | Cupones / VIP             | ✅     | **Fuera de v1.** Sin tablas ni lógica de cupones ni tier VIP                                                                                                                                                                                                                                                                                                                                                                  |
| 17  | Bundles en órdenes        | ✅     | Plantilla editable al crear orden; snapshot en `orders.shopping_cart` (Order shopping cart JSONB)                                                                                                                                                                                                                                                                                                                             |
| 18  | Precio en listado         | ✅     | Backend incluye campaña activa en query de productos y devuelve **precio final** — el front no recalcula                                                                                                                                                                                                                                                                                                                      |
| 19  | Nombre del proyecto       | ✅     | **`de-tin-marin`** (carpeta repo, scope npm `@de-tin-marin/*`, marca **De Tin Marín**). Reemplaza nombre provisional `candy`                                                                                                                                                                                                                                                                                                  |
| 20  | Errores en Server Actions | ✅     | Cuerpo de toda action envuelto en `guardAction(scope, run)`. Nunca tragar errores: `logServerError` en helpers server-only. Inesperados → `{ ok:false, error:"UNEXPECTED", message }`. Servicio: `apps/admin/src/shared/errors/server-error.ts`                                                                                                                                                                               |
| 21  | Grants de schemas propios | ✅     | Exponer schema en la API **no basta**: cada migración que crea tablas en un schema propio debe incluir `GRANT USAGE` + privilegios para `anon`/`authenticated`. RLS gobierna filas. Ver `00003_api_grants.sql`                                                                                                                                                                                                                |
| 22  | Modelo de bundles         | ✅     | Bundle = plantilla con `quantity` (nº de personas/porciones a las que apunta el pack) + `service_fee` (referencia/armado). `bundle_items` guarda `units_per_person` por producto (**v1 fija en 1**). Sin stock (#5), sin `prices` propio; total dinámico (#6)                                                                                                                                                                 |
| 23  | i18n                      | ✅     | **`next-intl` sin routing por URL** en ambas apps. `defaultLocale = 'es'`; v1 solo español (`en` declarado en `@de-tin-marin/config/i18n` para habilitar sin refactor). Catálogos en `apps/<app>/messages/es.json`; config en `apps/<app>/src/i18n/request.ts`; tipos aumentados en `src/global.d.ts`. Presentacionales puros: el texto se resuelve en container/layout y baja por props o `useTranslations` en client leaves |
| 24  | Campañas v1               | ✅     | **Fundación sin uso operativo.** Esquema `pricing.campaigns` + `products.campaign_id` (1:1) + `computeFinalPrice` en backend. Sin CRUD admin ni campañas activas en v1 → `finalPrice === netPrice`. El front solo consume `finalPrice`; activación operativa en etapa posterior                                                                                                                                               |
| 25  | Stock deduct — timing     | ✅     | **Regla de negocio:** descontar stock al pasar orden a `paid` (operador confirma pago manual). **Implementación:** S2A, después de S2C y **S1D**. S2B y S2C no incluyen deduct; algoritmo sealed/loose en unidades base                                                                                                                                                                                                       |

| 26 | Order shopping cart | ✅ | Detalle del pedido en **`commerce.orders.shopping_cart`** (JSONB). Sin tablas `order_items` / `order_bundle_items` en v1. Productos y sorpresas (bundles) congelados al pasar a `pending_payment` |
| 27 | Presentaciones de producto | ✅ | **`product_type`** (`package` \| `unit`), **`items_per_package`** (>= 1), **`package_label`** (UX). Default histórico = `unit` + `items_per_package=1`. Líneas producto venden **presentaciones**; bundles consumen **unidad base**. `unit` y `package` tienen semántica de stock distinta (#29) |
| 28 | Precios dual en JSONB | ✅ | **`prices.normal`** = precio presentación; **`prices.unit`** = precio unidad base. Ambos persistidos; **`unit` calculado al guardar** desde `normal` + `items_per_package`. Coherencia validada (Regla 2). Campaña aplica sobre `normal`; `finalUnitPrice` derivado |
| 29 | Stock por paquetes + tipo | ✅ | **`stock_sealed_packages`** + **`stock_loose_base_units`**. **`package`:** vendible = sealed×ipp+loose; deduct abre paquetes (`deductBaseUnits`). **`unit`:** vendible/deduct = **solo loose** (`deductUnitProductLoose`); sealed no se abre. Líneas product: `need = presentationQty × ipp + baseUnits` bundle. Migración `00014` |
| 30 | Envases de sorpresa + delivery | ✅ | **S1E.** Insumos en `catalog.surprise_containers` (no productos): stock + precio; 1 envase/sorpresa; bundles con `container_id` (drop `service_fee`). Delivery: `pricing.delivery_zones` + `pricing.delivery_settings`. Brief: `docs/stages/S1E/01-surprise-containers-delivery.md` |
| 31 | Límites de compra por producto | ✅ | **`purchase_min_quantity`** / **`purchase_max_quantity`** en `catalog.products` (presentación vendida; default **10** / **100**). `max_efectivo = min(max, stock_en_presentaciones)`; si stock < min → no comprable. **No aplica** a sorpresas/bundles ni wizard |
| 32 | SSR vs CSR y caché de datos | ✅ | **SSR** en navegación/catálogo donde sea viable. **CSR + RQ fresco** en carrito (sync al montar) y checkout (validate al submit). **Caché cliente catálogo:** `staleTime` Infinity; invalidación vía `catalog.catalog_cache_meta.version_at` + **Realtime Broadcast** (`catalog-version`) al bump en admin/deduct. Sin poll. Sin Next.js Data Cache por defecto. Detalle: `docs/rules/50-data-fetching-cache-ssr.md` |
| 33 | Packs / combos | ✅ | **`catalog.packs` + `pack_items`**. Combo ≠ sorpresa: sin personas, sin envase, BOM fija. Precio JSONB `reference` (suma `product.prices.normal × package_quantity`) + `normal` (admin); **`normal >= reference`**. Descuentos solo vía campaña 1:1 (`campaign_id`). Sin stock propio; disponibilidad y deduct al `paid` descuentan **presentaciones** de componentes. Min/max compra como productos. UI admin: Combos. Futuro (no v1): UOM unidad base / fracciones. Brief: `docs/stages/S1F/01-catalog-packs.md` |
| 34 | Media CDN (imágenes) | ✅ | **AWS S3 privado + CloudFront (OAC)** vía **CDK TypeScript** en `infra/cdk/`. Stacks **`MediaStaging`** y **`MediaProduction`** (entornos aislados; nombres AWS genéricos). URL CDN en `image_url`. Doc canónica: [`docs/infra.md`](infra.md). Brief: `docs/stages/S0/02-infra-media-cdn.md` |
| 35 | Upload imágenes catálogo (presign) | ✅ | Admin: **presigned PUT** diferido al **Guardar** en packs · products · bundles · containers (`folder` S3). URL CloudFront en `image_url`. jpeg/png/webp ≤ **10 MiB**. Action `createCatalogImageUploadUrlAction`; IAM uploader en CDK. Brief: `docs/stages/S0/03-admin-pack-image-upload.md` · [`infra.md`](infra.md) |

## Docs sincronizados (2026-07-28 — catalog_version + Broadcast + funnel)

- DECISIONS #32 — Infinity + Broadcast; carrito sync al montar; checkout validate al submit
- Migraciones `00017_catalog_cache_meta.sql`, `00018_catalog_version_broadcast.sql`
- `docs/rules/50-data-fetching-cache-ssr.md`, `00-architecture.md`, `85-react-components.md`
- `docs/database.md` — `catalog_cache_meta` + `bump_catalog_version`
- READMEs ecommerce catalog/cart/checkout + admin catalog/orders
- `@de-tin-marin/shared/catalog-version` — topic/event
- Gate: `useCatalogVersionGate` (Broadcast + visibility safety; sin poll)

## Docs sincronizados (2026-07-02)

- `database.md`
- `business-rules.md`
- `pricing.md`
- `campaigns.md`
- `inventory.md`
- `orders.md`
- `roadmap.md`

## Docs sincronizados (2026-07-02 — rename)

- Todos los `.md` del repo: `candy` → `de-tin-marin`, `@candy/*` → `@de-tin-marin/*`, marca **De Tin Marín**

## Docs sincronizados (2026-07-03 — S1A errores + grants)

- `rules/40-validation-and-boundaries.md` — sección de manejo de errores y logging
- `supabase/README.md` — nota de grants + migración `00003_api_grants.sql`

## Docs sincronizados (2026-07-03 — S1B modelo de bundles)

- `database.md` — `catalog.bundles` gana `image_url` y `quantity`, pierde `prices` (precio dinámico); `bundle_items.quantity` → `units_per_person`
- `docs/stages/S1B/01-bundles.md` — brief con modelo de precio dinámico
- DECISIONS #6 reescrita; #22 nueva (modelo de bundles)

## Docs sincronizados (2026-07-03 — i18n)

- DECISIONS #23 nueva (i18n con `next-intl`, default `es`)
- `@de-tin-marin/config/i18n` — `locales`, `defaultLocale`, `Locale`, `isLocale`
- `apps/ecommerce` y `apps/admin`: `src/i18n/request.ts`, `messages/es.json`, `next.config.ts` con `createNextIntlPlugin`, layout con `NextIntlClientProvider`, `src/global.d.ts` (tipado de mensajes)

## Docs sincronizados (2026-07-03 — S1C campañas fundación)

- `docs/stages/S1C/01-pricing-campaigns-foundation.md` — brief fundación sin uso operativo v1
- `campaigns.md`, `pricing.md` — acotación v1
- DECISIONS #24 (campañas dormidas en v1)

## Docs sincronizados (2026-07-03 — stock deduct timing)

- `roadmap.md` — orden S2B → S2C → S2A; S3 depende de S2A
- `orders.md`, `inventory.md`, `database.md` — deduct fuera de S2B/S2C
- DECISIONS #25 (deduct al `paid`, implementación en S2A post-S2C)

## Docs sincronizados (2026-07-03 — order shopping cart)

- `orders.md` — estados sin draft/shipped; cabecera + `shopping_cart` JSONB
- `database.md`, `business-rules.md`, `inventory.md`, `pricing.md`, `architecture.md`, `roadmap.md`
- DECISIONS #17 actualizada; #26 nueva (sin tablas de líneas)

## Docs sincronizados (2026-07-06 — S1D presentaciones + stock)

- `docs/stages/S1D/01-products-packages-stock.md` — brief refactor catálogo
- `database.md` — `product_type`, `items_per_package`, `prices.unit`, stock sealed/loose
- `business-rules.md` — Reglas 2, 4, 8, 9, 15
- `pricing.md`, `inventory.md`, `roadmap.md`
- DECISIONS #13, #15, #25 actualizadas; #27, #28, #29, #30 nuevas

## Docs sincronizados (2026-07-09 — SSR, caché y data fetching)

- DECISIONS #32 nueva (SSR vs CSR, 15 min catálogo, fresco en funnel de compra)
- `docs/rules/50-data-fetching-cache-ssr.md` — reglas de fetching, query keys, anti-patrones
- `docs/rules/00-architecture.md` — sección fetching y caché
- `docs/rules/85-react-components.md` — SSR vs RQ en containers
- `apps/ecommerce/src/modules/catalog/README.md` — matriz SSR/CSR por ruta
- `apps/ecommerce/src/modules/cart/README.md` — patrón RQ fresco
- `apps/admin/src/modules/orders/README.md` — preview y actions
- `apps/ecommerce` y `apps/admin`: `query-cache.ts`, `QueryProvider` con defaults 15 min

## Docs sincronizados (2026-07-28 — stock unit vs package + presentaciones)

- DECISIONS #27, #29 — `unit` solo loose; líneas product en presentaciones
- `business-rules.md` — Reglas 4, 15, 21
- `inventory.md`, `database.md`, `orders.md`
- `docs/stages/S2A/01-stock-deduct-on-payment.md` — algoritmo + helpers
- `docs/stages/S1D/01-products-packages-stock.md` — nota supersede OUT `unit`
- Código: `product-stock` (`deductProductStock`, …), `checkOrderStock`, migración `00014`

## Docs sincronizados (2026-07-28 — packs / combos S1F + S3A-05)

- DECISIONS #33 — packs BOM fija, reference/normal, deduct presentaciones
- `docs/stages/S1F/01-catalog-packs.md`, `docs/stages/S3A/05-catalog-packs-ecommerce.md`
- `business-rules.md` — Reglas 15 (pack), 22–25
- `database.md`, `orders.md`, `pricing.md`, `inventory.md`, `campaigns.md`, `architecture.md`, `roadmap.md`
- `CLAUDE.md` — dominio Packs
- READMEs admin catalog/orders + ecommerce cart/catalog
- Código: migración `00016`, `pack-price`, order-cart `type: pack`, admin/ecommerce combos

## Docs sincronizados (2026-07-28 — infra media CDN)

- DECISIONS #34 — S3 + CloudFront vía CDK en `infra/cdk/`
- `docs/stages/S0/02-infra-media-cdn.md`
- `infra/cdk/README.md`

## Docs sincronizados (2026-07-28 — pack image upload)

- DECISIONS #35 — presign (inicialmente packs; ampliado 2026-07-29 a todo catálogo)
- `docs/stages/S0/03-admin-pack-image-upload.md`
- Admin: `modules/media/`, pack-form upload UI, env AWS/media

## Docs sincronizados (2026-07-29 — infra staging + production)

- `docs/infra.md` — doc canónica media CDN (reglas, stacks, deploy)
- `MediaProduction` en `infra/cdk/bin/app.ts`
- Scripts `infra:deploy:staging` / `infra:deploy:production`
- `docs/README.md`, `architecture.md`, DECISIONS #34

## Docs sincronizados (2026-07-29 — upload catálogo completo)

- DECISIONS #35 — presign en packs · products · bundles · containers
- `docs/stages/S0/03-admin-pack-image-upload.md` — scope ampliado; estado done
- `docs/infra.md` — fuera de scope sin “otro brief” para forms
- `docs/database.md` — `image_url` = URL CDN (texto)
- `docs/roadmap.md` § S0 media
- READMEs admin catalog

## Cómo añadir una decisión

1. Agregar fila con estado `⏳ Abierto` o `✅` resuelta.
2. Actualizar docs referenciados.
3. Mencionar en el PR qué docs se sincronizaron.
