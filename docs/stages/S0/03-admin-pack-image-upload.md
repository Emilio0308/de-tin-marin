# S0-03 · Admin — upload imágenes catálogo (presign S3)

|                |                                                                    |
| -------------- | ------------------------------------------------------------------ |
| **Etapa**      | S0 — plataforma + admin catálogo                                   |
| **Owner**      | platform / admin                                                   |
| **App(s)**     | admin                                                              |
| **Schemas**    | catalog (`image_url` texto sin cambio de schema)                   |
| **Depende de** | [S0/02-infra-media-cdn.md](02-infra-media-cdn.md), S1A/S1B/S1E/S1F |
| **Estado**     | done                                                               |

## Contexto

- Infra staging/prod: S3 privado + CloudFront + IAM `media-uploader-*` (DECISIONS #34/#35).
- Catálogo ya persistía `image_url` texto; los forms pegaban URL a mano.
- Ecommerce solo lee `imageUrl` del DTO (sin credenciales AWS).

## Objetivo

En create/edit de **packs, productos, bundles y containers**, el staff elige un archivo; al **Guardar**, el admin obtiene URL prefirmada, hace PUT a S3 y guarda la URL CDN en `image_url`.

## Scope IN

- Extensión CDK: IAM user PutObject + output `UploaderUserName`
- Env admin: `AWS_*`, `MEDIA_S3_BUCKET`, `NEXT_PUBLIC_MEDIA_CDN_BASE_URL`
- Módulo `apps/admin/src/modules/media/` (schemas, services, actions)
- Action genérica `createCatalogImageUploadUrlAction` + `folder`:
  | Form                       | Folder S3    |
  | -------------------------- | ------------ |
  | Combos (`pack-form`)       | `packs`      |
  | Productos (`product-form`) | `products`   |
  | Sorpresas (`bundle-form`)  | `bundles`    |
  | Envases (`container-form`) | `containers` |
- Allowlist: jpeg/png/webp · máx **10 MiB**
- **Upload diferido al Guardar** (preview local con `blob:`; PUT S3 solo si el usuario guarda)
- Wrapper legacy `createPackImageUploadUrlAction` (delega al genérico)

## Scope OUT

- Borrado de objetos S3 huérfanos / al soft-delete
- Dominio custom CDN
- Cambios ecommerce (solo consume CDN URL)
- Tabla de assets en Postgres

## AuthZ

`createCatalogImageUploadUrlAction` → `requireStaff` + Zod; el client **no** elige el path S3 (`{folder}/{uuid}.{ext}` lo arma el server).

## Criterios de aceptación

- [x] Staff sube imagen en packs / products / bundles / containers; al guardar `image_url` es URL CloudFront
- [x] Tipos/tamaño inválidos rechazados en client y server
- [x] Tests presentational de los cuatro forms (preview + empty + clear)
- [x] `pnpm --filter @de-tin-marin/admin typecheck` verde (con env o `SKIP_ENV_VALIDATION`)

## Referencias

- [infra.md](../../infra.md)
- [DECISIONS.md](../../DECISIONS.md) #34 · #35
- [catalog README](../../../apps/admin/src/modules/catalog/README.md)
