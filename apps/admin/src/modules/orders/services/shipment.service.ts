import "server-only";

import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { upsertShipmentInputSchema } from "@de-tin-marin/validations/shipment";
import { getOrderByIdRepo } from "../repositories/order.repository";
import {
  getShipmentByOrderIdRepo,
  upsertShipmentRepo,
} from "../repositories/shipment.repository";
import { parseShipmentDto } from "../types/payment-shipment.dto";
import type { ShipmentDto } from "@de-tin-marin/validations/shipment";

export async function getShipmentService(
  config: SupabaseConfig,
  orderId: string,
): Promise<
  { ok: true; data: ShipmentDto | null } | { ok: false; error: "NOT_FOUND" }
> {
  const order = await getOrderByIdRepo(config, orderId);
  if (!order) return { ok: false, error: "NOT_FOUND" };

  const shipment = await getShipmentByOrderIdRepo(config, orderId);
  return {
    ok: true,
    data: shipment ? parseShipmentDto(shipment) : null,
  };
}

export async function upsertShipmentService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: ShipmentDto }
  | { ok: false; error: "VALIDATION" | "NOT_FOUND" }
> {
  const parsed = upsertShipmentInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const order = await getOrderByIdRepo(config, parsed.data.orderId);
  if (!order) return { ok: false, error: "NOT_FOUND" };

  const existing = await getShipmentByOrderIdRepo(config, parsed.data.orderId);
  const now = new Date().toISOString();

  let shippedAt = existing?.shipped_at ?? null;
  let deliveredAt = existing?.delivered_at ?? null;

  if (parsed.data.status === "shipped" && !shippedAt) {
    shippedAt = now;
  }

  if (parsed.data.status === "delivered") {
    if (!shippedAt) shippedAt = now;
    if (!deliveredAt) deliveredAt = now;
  }

  const row = await upsertShipmentRepo(config, {
    order_id: parsed.data.orderId,
    status: parsed.data.status,
    tracking_number: parsed.data.trackingNumber ?? null,
    carrier: parsed.data.carrier ?? null,
    notes: parsed.data.notes ?? null,
    shipped_at: shippedAt,
    delivered_at: deliveredAt,
  });

  return { ok: true, data: parseShipmentDto(row) };
}
