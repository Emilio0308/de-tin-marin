# Campaigns — De Tin Marín

> **Responsabilidad:** definir campañas promocionales y asignarlas a productos (1:1). El **precio final** se calcula en el listado de productos (dominio Pricing).

## Modelo v1

Una sola tabla principal + FK en productos:

| Entidad    | Tabla                                                |
| ---------- | ---------------------------------------------------- |
| Campaña    | `pricing.campaigns`                                  |
| Asignación | `catalog.products.campaign_id` → campaigns (**1:1**) |

> v1 **sin** `campaign_rules`, listas separadas ni múltiples campañas por producto.

## `pricing.campaigns`

| Campo         | Tipo         | Notas                                    |
| ------------- | ------------ | ---------------------------------------- |
| `id`          | uuid         | PK                                       |
| `name`        | text         |                                          |
| `description` | text         | Opcional                                 |
| `percentage`  | numeric(5,2) | Descuento sobre `prices.normal.netPrice` |
| `starts_at`   | timestamptz  | Inicio                                   |
| `ends_at`     | timestamptz  | Fin                                      |
| `is_active`   | boolean      | Kill switch manual                       |

## Relación producto ↔ campaña

- **Un producto = máximo una campaña** asignada (`products.campaign_id`).
- Al asignar una campaña nueva a un producto que ya tenía otra → **reemplazar** el `campaign_id`.
- Productos **sin** `campaign_id` o con campaña **expirada/inactiva** → precio = `prices.normal` sin descuento.
- El descuento aplica **solo** a productos que tengan la campaña asignada y vigente — no es global automática.

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

El listado de productos (Server Action / repository) hace JOIN a `campaigns`, valida vigencia y devuelve `finalPrice` — **el front no recalcula**.

## Admin — pantallas

- CRUD campañas (nombre, %, fechas, descripción)
- Asignar campaña a producto(s) desde producto o desde campaña
- Indicador: activa / programada / expirada
- Al expirar: el producto sigue con `campaign_id` pero el backend ignora la campaña si fuera de fecha (opcional: job que limpia `campaign_id` — v2)

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
- Aplicar descuento en el frontend
- Descontar stock → **Orders** al `paid`

## Reglas relacionadas

Reglas 9–11 en [`business-rules.md`](business-rules.md).
