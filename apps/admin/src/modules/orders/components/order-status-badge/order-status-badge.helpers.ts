import type { OrderStatus } from "@de-tin-marin/shared/order-cart";
import { cn } from "@de-tin-marin/shared/cn";

export type PaymentStatusKey = "pending" | "confirmed" | "refunded";

const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-900",
  paid: "bg-secondary-container text-on-secondary-container",
  preparing: "bg-secondary-container text-on-secondary-container",
  ready: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  delivered: "bg-emerald-100 text-emerald-900",
  completed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-surface-container-high text-on-surface-variant",
};

const PAYMENT_STATUS_BADGE_CLASS: Record<PaymentStatusKey, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-secondary-container text-on-secondary-container",
  refunded: "bg-surface-container-high text-on-surface-variant",
};

export function orderStatusBadgeClass(status: string): string {
  return (
    ORDER_STATUS_BADGE_CLASS[status as OrderStatus] ??
    "bg-surface-container-high text-on-surface-variant"
  );
}

export function paymentStatusBadgeClass(status: string): string {
  return (
    PAYMENT_STATUS_BADGE_CLASS[status as PaymentStatusKey] ??
    "bg-surface-container-high text-on-surface-variant"
  );
}

export function statusBadgeClassName(className?: string): string {
  return cn(
    "font-label text-label-bold inline-flex items-center rounded-full px-3 py-1 text-xs",
    className,
  );
}
