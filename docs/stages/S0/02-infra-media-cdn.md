# S0-02 · Infra media CDN (S3 + CloudFront)

|                |                                                           |
| -------------- | --------------------------------------------------------- |
| **Etapa**      | S0 — plataforma ([roadmap.md](../../roadmap.md))          |
| **Owner**      | platform                                                  |
| **App(s)**     | ninguna (IaC en `infra/cdk`)                              |
| **Schemas**    | —                                                         |
| **Depende de** | [S0/01-monorepo-foundation.md](01-monorepo-foundation.md) |
| **Estado**     | done                                                      |

## Contexto (leer esto, no todo docs/)

- Catálogo ya guarda `image_url` como texto (productos, bundles, packs, containers).
- Admin hoy pega URL a mano; Storage diferido en briefs S1A/S1B.
- Objetivo de producto: Admin sube → S3 → CloudFront → URL en `image_url` → ecommerce lee.
- DECISIONS #34 — media en AWS vía CDK (no Terraform).

## Objetivo

Con `cdk deploy`, existir en AWS un bucket S3 privado y una distribución CloudFront (OAC) que sirva objetos por HTTPS; outputs `BucketName`, `DistributionDomainName`, `CdnBaseUrl`.

## Scope IN

- Package `@de-tin-marin/infra-cdk` en `infra/cdk/`
- Stack staging `MediaStaging` (región `us-east-1`); nombres AWS genéricos (`media-staging-<accountId>`, sin marca de producto)
- S3: Block Public Access, SSE-S3, enforce SSL, CORS PUT/GET/HEAD para `http://localhost:3001`
- CloudFront: origin S3 con OAC, redirect HTTPS, compress
- Scripts root: `infra:bootstrap`, `infra:synth`, `infra:deploy`
- README de operación + verificación curl/CLI

## Scope OUT (traps)

- **NO** upload / presigned URLs / IAM de la app → ~~paso siguiente~~ **done en [S0/03](03-admin-pack-image-upload.md)**
- **NO** cambios en forms admin ni `image_url` schema → forms en S0/03; schema `image_url` sigue texto
- **NO** dominio custom / ACM / Route53
- **NO** Terraform / DynamoDB / segundo bucket de state
- **NO** meter infra en `pnpm dev` ni turbo `build` de apps

> Scope OUT original excluía stack production; añadido después — ver `docs/infra.md`.

## Contratos

N/A (sin DTOs de app). Outputs CFn: `BucketName`, `DistributionDomainName`, `CdnBaseUrl`.

## AuthZ

N/A. Deploy requiere credenciales AWS del operador.

## Criterios de aceptación

- [x] `pnpm infra:synth` genera template sin error
- [x] `pnpm --filter @de-tin-marin/infra-cdk typecheck` verde
- [x] Tras deploy: objeto vía CDN → 200; URL directa S3 → 403
- [x] README en `infra/cdk/README.md` documenta bootstrap/deploy/verify

> **Post-brief:** stack `MediaProduction` + scripts `infra:deploy:staging` / `infra:deploy:production` — ver [`docs/infra.md`](../../infra.md). Upload admin → [S0/03](03-admin-pack-image-upload.md).

## Orden de implementación

1. Scaffold `infra/cdk` + workspace + gitignore + scripts
2. `MediaStack` (S3 + CloudFront + outputs)
3. Docs (DECISIONS #34 + este brief + README)
4. `cdk synth` / typecheck

## Tests

- Verificación manual post-deploy (README). Sin Vitest/Playwright en este brief.
