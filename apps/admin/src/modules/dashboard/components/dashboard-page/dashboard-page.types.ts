export type DashboardPeriod = "daily" | "weekly" | "monthly";

export type DashboardStatIcon = "products" | "campaigns" | "orders";

export type DashboardStatCard = {
  id: string;
  icon: DashboardStatIcon;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "secondary" | "tertiary";
};

export type DashboardRecentOrder = {
  id: string;
  orderId: string;
  customer: string;
  lineSummary: string;
  amount: string;
  timeAgo: string;
  statusLabel: string;
  statusVariant: "default" | "success" | "muted" | "secondary";
  href: string;
};

export type DashboardAlertItem = {
  id: string;
  icon: "warning" | "add";
  message: string;
  timeAgo: string;
};

export type DashboardPageLabels = {
  welcome: string;
  subtitle: string;
  periodDaily: string;
  periodWeekly: string;
  periodMonthly: string;
  recentOrdersTitle: string;
  viewAllOrders: string;
  columnOrderId: string;
  columnCustomer: string;
  columnProduct: string;
  columnAmount: string;
  columnStatus: string;
  inventoryAlertsTitle: string;
  activityTitle: string;
  loadMoreActivity: string;
  alertTitle: string;
  alertDescription: string;
  alertPriority: string;
  alertTag: string;
  quickAdd: string;
  emptyOrders: string;
  emptyAlerts: string;
};

export type DashboardPageProps = {
  labels: DashboardPageLabels;
  stats: DashboardStatCard[];
  recentOrders: DashboardRecentOrder[];
  alerts: DashboardAlertItem[];
};
