export const GUEST_ORDER_STATUS_LABEL_KEYS = [
  "pending_payment",
  "paid",
  "preparing",
  "ready",
  "delivered",
  "completed",
  "cancelled",
] as const;

export const GUEST_PAYMENT_STATUS_LABEL_KEYS = [
  "pending",
  "confirmed",
  "refunded",
] as const;

export function resolveGuestOrderStatusLabel(
  status: string,
  labels: Record<string, string>,
): string {
  return labels[status] ?? status;
}

export function resolveGuestPaymentStatusLabel(
  paymentStatus: string,
  labels: Record<string, string>,
): string {
  return labels[paymentStatus] ?? paymentStatus;
}
