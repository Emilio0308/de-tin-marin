# Campaigns — De Tin Marín

> **Responsabilidad:** definir campañas promocionales y asignarlas 1:1 a **productos** o **packs** (DECISIONS #24 / #33). El **precio final** se calcula en listado (dominio Pricing).

> **Acotación v1 (DECISIONS #24):** el esquema y el helper `computeFinalPrice` existen, pero **no hay campañas activas ni UI admin de campañas en v1**. Sin asignaciones → `finalPrice === netPrice`. La activación operativa (CRUD campañas) se implementará en una etapa posterior sin cambiar el contrato de DTOs. Admin de packs ya permite elegir `campaign_id` existente.
>
> **RLS (S3A-1-R / `00021`):** policy `campaigns_select_public` — `SELECT` público (necesario para `list_public_packs` y `finalPrice` en tienda). Mutaciones siguen siendo staff.

## Modelo v1

Una sola tabla principal + FKs:

| Entidad    | Tabla                                                |
| ---------- | ---------------------------------------------------- |
| Campaña    | `pricing.campaigns`                                  |
| Asignación | `catalog.products.campaign_id` → campaigns (**1:1**) |
| Asignación | `catalog.packs.campaign_id` → campaigns (**1:1**)    |

> v1 **sin** `campaign_rules`, listas separadas ni múltiples campañas por entidad.

## `pricing.campaigns`

| Campo         | Tipo         | Notas                                                           |
| ------------- | ------------ | --------------------------------------------------------------- |
| `id`          | uuid         | PK                                                              |
| `name`        | text         |                                                                 |
| `description` | text         | Opcional                                                        |
| `percentage`  | numeric(5,2) | Descuento sobre `prices.normal.netPrice` (presentación / combo) |
| `starts_at`   | timestamptz  | Inicio                                                          |
| `ends_at`     | timestamptz  | Fin                                                             |
| `is_active`   | boolean      | Kill switch manual                                              |

## Relación producto/pack ↔ campaña

- **Un producto = máximo una campaña** (`products.campaign_id`).
- **Un pack = máximo una campaña** (`packs.campaign_id`).
- Al asignar una campaña nueva → **reemplazar** el `campaign_id`.
- Sin `campaign_id` o campaña **expirada/inactiva** → precio = `prices.normal` sin descuento.
- El descuento aplica **solo** a la entidad asignada y vigente — no es global automática.

## Cálculo de precio final

```typescript
function applyCampaign(
  normal: { netPrice: number; igv: number; subtotal: number },
  campaign: { percentage: number } | null,
): number {
  if (!campaign) return normal.netPrice;
  return round(normal.netPrice * (1 - campaign.percentage / 100));
}
```

Listados (producto o pack) hacen JOIN a `campaigns`, validan vigencia y devuelven `finalPrice` — **el front no recalcula**.

Para bundles y costeo por sorpresa (S1D): `finalUnitPrice = finalPrice / items_per_package`. Sin campaña: `prices.unit.netPrice`.

Para packs (S1F): campaña sobre `prices.normal` del combo; `reference` no se descuenta por separado.

## Admin — pantallas

> **v1:** CRUD de campañas planificado abajo — **no implementado** hasta activación operativa (DECISIONS #24). Asignación desde formulario de producto/pack sí existe como campo `campaignId`.

- CRUD campañas (nombre, %, fechas, descripción)
- Asignar campaña a producto(s) / pack(s) desde la entidad o desde campaña
- Indicador: activa / programada / expirada
- Al expirar: la entidad sigue con `campaign_id` pero el backend ignora la campaña si fuera de fecha (opcional: job que limpia `campaign_id` — v2)

## API (planificada)

| Action                      | Rol   | Descripción                                     |
| --------------------------- | ----- | ----------------------------------------------- |
| `createCampaign`            | admin | Nueva campaña                                   |
| `updateCampaign`            | admin | Editar                                          |
| `assignCampaignToProduct`   | admin | Set `products.campaign_id` (reemplaza anterior) |
| `removeCampaignFromProduct` | admin | `campaign_id = null`                            |
| `listCampaigns`             | admin | Listado                                         |

## No hacer aquí

- Calcular total de sorpresa/bundle → **Pricing** (`bundle-line-price`)
- Calcular reference de pack → **Pricing** (`pack-price`)
- Aplicar descuento en el frontend
- Descontar stock → **Orders** al `paid`

## Reglas relacionadas

Reglas 9–11 y 23 en [`business-rules.md`](business-rules.md).
