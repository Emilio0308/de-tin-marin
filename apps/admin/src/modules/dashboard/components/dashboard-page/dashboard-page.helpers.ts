import type { OrderListItem } from "@de-tin-marin/validations/order";
import type { ProductListItem } from "@de-tin-marin/validations/product";
import type {
  DashboardAlertItem,
  DashboardRecentOrder,
  DashboardStatCard,
} from "./dashboard-page.types";

const PENDING_ORDER_STATUSES = new Set([
  "pending_payment",
  "paid",
  "preparing",
  "ready",
]);

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

export function countPendingOrders(orders: OrderListItem[]): number {
  return orders.filter((order) => PENDING_ORDER_STATUSES.has(order.status))
    .length;
}

export function mapRecentOrders(
  orders: OrderListItem[],
  labels: {
    statusLabels: Record<string, string>;
    lineSummary: (lineCount: number, total: number) => string;
    timeAgo: (createdAt: string) => string;
  },
): DashboardRecentOrder[] {
  return [...orders]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )
    .slice(0, 5)
    .map((order) => ({
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
  products: ProductListItem[],
  labels: {
    lowStock: (name: string, quantity: number) => string;
  },
): DashboardAlertItem[] {
  return products
    .filter(
      (product) =>
        product.stockTotalBaseUnits > 0 && product.stockTotalBaseUnits < 10,
    )
    .slice(0, 4)
    .map((product) => ({
      id: product.id,
      icon: "warning" as const,
      message: labels.lowStock(product.name, product.stockTotalBaseUnits),
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
