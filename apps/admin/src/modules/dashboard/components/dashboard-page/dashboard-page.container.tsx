import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { supabaseConfig } from "@/config/env";
import { CatalogExportPanelContainer } from "@/modules/reports/components/catalog-export-panel/catalog-export-panel.container";
import { getDashboardSummaryService } from "@/modules/dashboard/services/dashboard-summary.service";
import { requireStaff } from "@/shared/auth/require-staff";
import { DashboardPage } from "./dashboard-page";
import {
  buildDashboardStats,
  buildLowStockAlerts,
  formatRelativeTimeEs,
  mapRecentOrders,
} from "./dashboard-page.helpers";

export async function DashboardPageContainer() {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) redirect("/login");

  const t = await getTranslations("dashboard");
  const summary = await getDashboardSummaryService(supabaseConfig);

  const statusLabels = {
    pending_payment: t("orderStatus.pending_payment"),
    paid: t("orderStatus.paid"),
    preparing: t("orderStatus.preparing"),
    ready: t("orderStatus.ready"),
    delivered: t("orderStatus.delivered"),
    completed: t("orderStatus.completed"),
    cancelled: t("orderStatus.cancelled"),
  };

  const stats = buildDashboardStats({
    productCount: summary.productCount,
    pendingOrderCount: summary.pendingOrderCount,
    labels: {
      totalProducts: t("stats.totalProducts"),
      productsTrend: t("stats.productsTrend", {
        count: summary.productCount,
      }),
      activeCampaigns: t("stats.activeCampaigns"),
      campaignsUnavailable: t("stats.campaignsUnavailable"),
      pendingOrders: t("stats.pendingOrders"),
      pendingOrdersHint: t("stats.pendingOrdersHint"),
    },
  });

  const recentOrders = mapRecentOrders(summary.recentOrders, {
    statusLabels,
    lineSummary: (lineCount, total) =>
      t("recentOrders.lineSummary", {
        count: lineCount,
        amount: total.toFixed(2),
      }),
    timeAgo: formatRelativeTimeEs,
  });

  const alerts = buildLowStockAlerts(summary.lowStockAlerts, {
    lowStock: (name, quantity) => t("alerts.lowStock", { name, quantity }),
  });

  return (
    <DashboardPage
      labels={{
        welcome: t("welcome"),
        subtitle: t("subtitle"),
        periodDaily: t("period.daily"),
        periodWeekly: t("period.weekly"),
        periodMonthly: t("period.monthly"),
        recentOrdersTitle: t("recentOrders.title"),
        viewAllOrders: t("recentOrders.viewAll"),
        columnOrderId: t("recentOrders.columns.orderId"),
        columnCustomer: t("recentOrders.columns.customer"),
        columnProduct: t("recentOrders.columns.product"),
        columnAmount: t("recentOrders.columns.amount"),
        columnStatus: t("recentOrders.columns.status"),
        inventoryAlertsTitle: t("alerts.title"),
        activityTitle: t("activity.title"),
        loadMoreActivity: t("activity.loadMore"),
        alertTitle: t("promo.title"),
        alertDescription: t("promo.description"),
        alertPriority: t("promo.priority"),
        alertTag: t("promo.tag"),
        quickAdd: t("quickAdd"),
        emptyOrders: t("recentOrders.empty"),
        emptyAlerts: t("alerts.empty"),
      }}
      stats={stats}
      recentOrders={recentOrders}
      alerts={alerts}
      catalogExport={<CatalogExportPanelContainer />}
    />
  );
}
