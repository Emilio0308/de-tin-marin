# Dashboard — módulo admin

Resumen operativo del home admin (`/`). No lista catálogos completos.

## Capas

```text
dashboard-page.container → getDashboardSummaryService → dashboard.repository / product&order repos
```

## Datos

| Campo               | Fuente                                                     |
| ------------------- | ---------------------------------------------------------- |
| `productCount`      | `countProductsRepo` (head count)                           |
| `pendingOrderCount` | count órdenes en estados operativos                        |
| `recentOrders`      | `listOrdersPage` pageSize 5                                |
| `lowStockAlerts`    | candidatos activos ordenados por stock + filtro total < 10 |

Auth: `requireStaff` en el container (redirect `/login`).

Ver [`50-data-fetching-cache-ssr.md`](../../../../docs/rules/50-data-fetching-cache-ssr.md).
