# Guía de Arquitectura AI-First Development

... \# Visión

Este proyecto no es una aplicación con IA integrada; es una aplicación
diseñada desde el inicio para ser desarrollada y mantenida con ayuda de
IA. La arquitectura prioriza modularidad, contexto reducido y
documentación.

## Objetivos

- Ecommerce de dulces y sorpresas.
- Backoffice administrativo.
- Backend compartido.
- Stack: Next.js, React, TypeScript, Supabase, PostgreSQL, Vercel.

# Monorepo

```text
apps/
  ecommerce/
  admin/

packages/
  ui/
  db/
  shared/
  types/
  services/
  validations/
  config/
  ai/

supabase/
docs/
```

# Principios

1.  Arquitectura por dominios.
2.  Archivos pequeños (150--300 líneas cuando sea posible).
3.  Documentación cercana al código.
4.  Reglas de negocio explícitas.
5.  Tipos y validaciones compartidas.

# Dominios

- Products
- Bundles
- Pricing
- Campaigns
- Orders
- Inventory
- Customers
- Payments
- Shipping
- Notifications
- Reports
- Users
- Settings

Cada dominio:

```text
domains/
  products/
    components/
    hooks/
    services/
    validators/
    repository/
    actions/
    tests/
    README.md
```

## Responsabilidades

### Products

- CRUD
- SKU
- Stock
- Categorías
- Imágenes
- Precio base

### Bundles

Agrupan productos (sorpresas) sin duplicarlos.

### Pricing

Calcula el precio final:

```text
Precio Base
↓
Campaña
↓
Descuento
↓
Cupón
↓
Cliente VIP
↓
Precio Final
```

### Campaigns

Promociones por rango de fechas.

### Orders

Estados:

```text
Draft
Pending Payment
Paid
Preparing
Ready
Shipped
Delivered
Completed
Cancelled
```

No calcula precios.

### Inventory

Descuenta componentes de bundles y registra movimientos.

# Modelo conceptual

- Product
- Bundle
- Campaign
- CampaignRule
- PriceRule
- InventoryItem
- InventoryMovement
- Order
- OrderItem
- Payment
- Shipment
- Customer
- Category

# Reglas

Ejemplo:

Regla 14

Cuando una orden pasa a Paid: 1. Descontar productos. 2. Si hay bundles,
descontar componentes. 3. Registrar InventoryMovement. 4. Si el stock
queda negativo, revertir.

# Documentación

```text
docs/
  vision.md
  architecture.md
  database.md
  pricing.md
  campaigns.md
  orders.md
  inventory.md
  business-rules.md
  coding-guidelines.md
```

# AI Context

Cada dominio debe incluir: - README.md - RULES.md - API.md - SCHEMA.md

La IA debe cargar únicamente el dominio relevante.

# Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- TanStack Query
- Zod
- Turborepo
- Vercel

# Roadmap

1.  Visión.
2.  Dominios.
3.  Modelo conceptual.
4.  Reglas de negocio.
5.  Esquema de BD.
6.  Diseño UI.
7.  Implementación.
8.  Pruebas.
