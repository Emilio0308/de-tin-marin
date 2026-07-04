import type { OrderListItem } from "@de-tin-marin/validations/order";

export type OrderListProps = {
  orders: OrderListItem[];
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pagada",
  preparing: "Preparando",
  ready: "Lista",
  delivered: "Entregada",
  completed: "Completada",
  cancelled: "Cancelada",
};
