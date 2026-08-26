import "server-only";

import { computeTotalBaseUnits } from "@de-tin-marin/shared/product-stock";
import type { OrderListItem } from "@de-tin-marin/validations/order";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  countProductsRepo,
  listLowStockProductCandidatesRepo,
} from "@/modules/catalog/repositories/product.repository";
import { listOrdersPageService } from "@/modules/orders/services/order.service";
import { countOrdersByStatusesRepo } from "../repositories/dashboard.repository";

export type DashboardLowStockAlert = {
  id: string;
  name: string;
  stockTotalBaseUnits: number;
};

export type DashboardSummary = {
  productCount: number;
  pendingOrderCount: number;
  lowStockAlerts: DashboardLowStockAlert[];
  recentOrders: OrderListItem[];
};

export async function getDashboardSummaryService(
  config: SupabaseConfig,
): Promise<DashboardSummary> {
  const [
    productCount,
    pendingOrderCount,
    lowStockCandidates,
    recentOrdersResult,
  ] = await Promise.all([
    countProductsRepo(config),
    countOrdersByStatusesRepo(config),
    listLowStockProductCandidatesRepo(config, 50),
    listOrdersPageService(config, { page: 1, pageSize: 5 }),
  ]);

  const lowStockAlerts = lowStockCandidates
    .map((row) => {
      const stockTotalBaseUnits = computeTotalBaseUnits(
        row.stock_sealed_packages,
        row.stock_loose_base_units,
        row.items_per_package ?? 1,
      );
      return {
        id: row.id,
        name: row.name,
        stockTotalBaseUnits,
      };
    })
    .filter(
      (item) => item.stockTotalBaseUnits > 0 && item.stockTotalBaseUnits < 10,
    )
    .slice(0, 4);

  return {
    productCount,
    pendingOrderCount,
    lowStockAlerts,
    recentOrders: recentOrdersResult.ok ? recentOrdersResult.data.items : [],
  };
}
