import type { OrderListItem } from "@de-tin-marin/validations/order";
import type { DashboardLowStockAlert } from "@/modules/dashboard/services/dashboard-summary.service";
import type {
  DashboardAlertItem,
  DashboardRecentOrder,
  DashboardStatCard,
} from "./dashboard-page.types";

export type DashboardStatLabels = {
  totalProducts: string;
  productsTrend: string;
  activeCampaigns: string;
  campaignsUnavailable: string;
  pendingOrders: string;
  pendingOrdersHint: string;
};

export function buildDashboardStats(input: {
  productCount: number;
  pendingOrderCount: number;
  labels: DashboardStatLabels;
}): DashboardStatCard[] {
  return [
    {
      id: "products",
      icon: "products",
      label: input.labels.totalProducts,
      value: input.productCount.toLocaleString("es-PE"),
      hint: input.labels.productsTrend,
      tone: "primary",
    },
    {
      id: "campaigns",
      icon: "campaigns",
      label: input.labels.activeCampaigns,
      value: "—",
      hint: input.labels.campaignsUnavailable,
      tone: "secondary",
    },
    {
      id: "orders",
      icon: "orders",
      label: input.labels.pendingOrders,
      value: input.pendingOrderCount.toLocaleString("es-PE"),
      hint: input.labels.pendingOrdersHint,
      tone: "tertiary",
    },
  ];
}

export function mapRecentOrders(
  orders: OrderListItem[],
  labels: {
    statusLabels: Record<string, string>;
    lineSummary: (lineCount: number, total: number) => string;
    timeAgo: (createdAt: string) => string;
  },
): DashboardRecentOrder[] {
  return orders.slice(0, 5).map((order) => ({
    id: order.id,
    orderId: order.orderNumber,
    customer: order.customerName || "—",
    lineSummary: labels.lineSummary(order.lineCount, order.total),
    amount: `S/ ${order.total.toFixed(2)}`,
    timeAgo: labels.timeAgo(order.createdAt),
    statusLabel:
      labels.statusLabels[order.status] ?? order.status.replaceAll("_", " "),
    statusVariant: resolveStatusVariant(order.status),
    href: `/orders/${order.id}`,
  }));
}

function resolveStatusVariant(
  status: string,
): DashboardRecentOrder["statusVariant"] {
  if (status === "delivered" || status === "completed") return "success";
  if (status === "pending_payment" || status === "paid") return "default";
  if (status === "preparing" || status === "ready") return "secondary";
  return "muted";
}

export function buildLowStockAlerts(
  alerts: DashboardLowStockAlert[],
  labels: {
    lowStock: (name: string, quantity: number) => string;
  },
): DashboardAlertItem[] {
  return alerts.map((alert) => ({
    id: alert.id,
    icon: "warning" as const,
    message: labels.lowStock(alert.name, alert.stockTotalBaseUnits),
    timeAgo: "",
  }));
}

export function formatRelativeTimeEs(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}
