# S4-11 · Envío courier (agencia nacional)

|                |                                                    |
| -------------- | -------------------------------------------------- |
| **Etapa**      | S4 — Completitud / fulfillment                     |
| **Owner**      | Equipo De Tin Marín                                |
| **App(s)**     | `apps/admin`, `apps/ecommerce`                     |
| **Schemas**    | `pricing`, `commerce`                              |
| **Depende de** | S1E delivery ✅, S2B órdenes ✅, S3A-3 checkout ✅ |
| **Estado**     | done                                               |

## Contexto

- `delivery` cubre Piura local (mapa + zonas + fee).
- El negocio necesita envíos **nacionales vía agencia** (Olva, Shalom, etc.)
  con **fee 0 en checkout** — el cliente paga el flete en la agencia según
  peso/destino.
- Cobertura por **departamento + provincia** administrable; provincia
  **Piura** (local) queda fuera del catálogo courier para no solaparse con
  `delivery`.

## Objetivo

Staff activa departamentos y provincias desde `/delivery`. Checkout guest
elige `courier`, completa DNI + nombre + dirección de agencia, y la orden
guarda snapshot congelado con `shipping_total = 0`. Admin puede crear órdenes
manuales con el mismo método.

## Scope IN

- Tabla `pricing.courier_departments` (`provinces` jsonb) +
  `pricing.delivery_settings.courier_enabled`
- Migración `00031_courier_departments.sql` (rewrite
  `commerce.insert_guest_order` para `courier`; exige `shipping_total = 0`) +
  pgTAP
- Shared/validations: `resolveCourierCoverage`, `courier` schemas, fee 0
- Admin `/delivery`: pestaña **Envío por agencia** (toggles dept/provincia)
- Admin order-form + detalle: método `courier`
- Ecommerce checkout: dept/provincia + DNI/nombre/agencia; opción visible solo
  si hay destinos activos y kill switch on
- Confirmación / lookup guest + emails

## Scope OUT (traps)

- **NO** reutilizar `deliveryAddress` de Piura para courier
- **NO** incluir provincia `Piura` en catálogo courier del dept. Piura
- **NO** calcular fee por peso/agencia en v1
- **NO** catálogo de agencias — dirección libre
- **NO** `pickup` en guest (sin cambio)
- **NO** confiar en nombres/slug del cliente — rehidratar desde DB
- **NO** editar nombres de provincias en admin — solo toggles `enabled`

## Tablas y RLS

| Tabla / objeto                | ¿Nueva? | Ops                                | Política                     | Test                               |
| ----------------------------- | ------- | ---------------------------------- | ---------------------------- | ---------------------------------- |
| `pricing.courier_departments` | sí      | SELECT público activos; CRUD staff | `is_active`; provincias JSON | `pricing__courier_departments.sql` |
| `pricing.delivery_settings`   | alter   | `courier_enabled`                  | SELECT público; UPDATE staff | existente + columna                |
| `commerce.insert_guest_order` | alter   | `courier` XOR + fee 0              | SECURITY DEFINER             | `commerce__guest_orders.sql`       |

## Snapshot `fulfillment.courier`

```json
{
  "destination": {
    "departmentId": "uuid",
    "departmentName": "Piura",
    "provinceSlug": "sullana",
    "provinceName": "Sullana"
  },
  "recipient": {
    "dni": "12345678",
    "fullName": "María García López",
    "agencyAddress": "Olva Courier - Av. Ugarte 123"
  }
}
```

## Rules que aplican

- Reglas **19**, **31**
- DECISIONS **#43**, **#42** (logística `in_transit`)

## Criterios de aceptación

- [x] Staff activa Lima o Piura dept. (Sullana/Talara, etc.) → checkout muestra courier
- [x] Provincia `Piura` no aparece en opciones courier
- [x] Guest completa courier → `shipping_total = 0`, snapshot congelado
- [x] Destino disabled → sin cobertura / error al submit
- [x] Admin crea orden courier; avanza a `in_transit` con carrier + tracking
- [x] RPC guest rechaza courier con `shipping_total > 0` o XOR inválido
- [x] `pnpm check` + `pnpm build` verdes
