import type { OrderListItem } from "@de-tin-marin/validations/order";

export type OrderListLabels = {
  columns: {
    orderNumber: string;
    customer: string;
    status: string;
    payment: string;
    total: string;
    lines: string;
    date: string;
    actions: string;
  };
  view: string;
  empty: string;
  statusLabels: Record<string, string>;
  paymentStatusLabels: Record<string, string>;
  formatLines: (count: number) => string;
};

export type OrderListProps = {
  orders: OrderListItem[];
  labels: OrderListLabels;
};
