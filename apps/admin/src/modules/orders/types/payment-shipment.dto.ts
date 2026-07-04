import type { PaymentSummary } from "@de-tin-marin/validations/payment";
import type { ShipmentDto } from "@de-tin-marin/validations/shipment";
import type { PaymentRow } from "../repositories/payment.repository";
import type { ShipmentRow } from "../repositories/shipment.repository";

export function parsePaymentSummary(row: PaymentRow): PaymentSummary {
  return {
    id: row.id,
    amount: Number(row.amount),
    status: row.status as PaymentSummary["status"],
    method: "internal",
    notes: row.notes,
    confirmedAt: row.confirmed_at,
    confirmedBy: row.confirmed_by,
  };
}

export function parseShipmentDto(row: ShipmentRow): ShipmentDto {
  return {
    id: row.id,
    orderId: row.order_id,
    status: row.status as ShipmentDto["status"],
    trackingNumber: row.tracking_number,
    carrier: row.carrier,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    notes: row.notes,
  };
}
