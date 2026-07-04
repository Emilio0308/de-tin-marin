import "server-only";

import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  confirmPaymentInputSchema,
  refundPaymentInputSchema,
} from "@de-tin-marin/validations/payment";
import {
  asJson,
  getOrderByIdRepo,
  updateOrderAfterPaymentRepo,
  updateOrderPaymentStatusRepo,
} from "../repositories/order.repository";
import {
  getPaymentByIdRepo,
  insertPaymentRepo,
  updatePaymentRepo,
} from "../repositories/payment.repository";

function appendPaymentMethod(
  existing: unknown,
  entry: { type: string; reference?: string; confirmedAt: string },
): unknown[] {
  const methods: unknown[] = Array.isArray(existing)
    ? (existing as unknown[])
    : [];
  return [...methods, entry];
}

export async function confirmPaymentService(
  config: SupabaseConfig,
  staffUserId: string,
  raw: unknown,
): Promise<
  | { ok: true; data: { orderId: string; paymentId: string; status: "paid" } }
  | {
      ok: false;
      error:
        "VALIDATION" | "NOT_FOUND" | "ORDER_NOT_PENDING" | "ALREADY_CONFIRMED";
    }
> {
  const parsed = confirmPaymentInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const order = await getOrderByIdRepo(config, parsed.data.orderId);
  if (!order) return { ok: false, error: "NOT_FOUND" };

  if (order.status !== "pending_payment") {
    return { ok: false, error: "ORDER_NOT_PENDING" };
  }

  if (order.payment_status === "confirmed") {
    return { ok: false, error: "ALREADY_CONFIRMED" };
  }

  const confirmedAt = new Date().toISOString();
  const payment = await insertPaymentRepo(config, {
    order_id: order.id,
    amount: order.total,
    currency_code: "PEN",
    status: "confirmed",
    method: "internal",
    confirmed_by: staffUserId,
    notes: parsed.data.notes ?? null,
    confirmed_at: confirmedAt,
  });

  const paymentMethods = appendPaymentMethod(order.payment_methods, {
    type: "internal",
    reference: parsed.data.paymentReference,
    confirmedAt,
  });

  await updateOrderAfterPaymentRepo(config, order.id, asJson(paymentMethods));

  return {
    ok: true,
    data: {
      orderId: order.id,
      paymentId: payment.id,
      status: "paid",
    },
  };
}

export async function refundPaymentService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: { paymentId: string; status: "refunded" } }
  | {
      ok: false;
      error: "VALIDATION" | "NOT_FOUND" | "NOT_CONFIRMED" | "ALREADY_REFUNDED";
    }
> {
  const parsed = refundPaymentInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const payment = await getPaymentByIdRepo(config, parsed.data.paymentId);
  if (!payment) return { ok: false, error: "NOT_FOUND" };

  if (payment.status === "refunded") {
    return { ok: false, error: "ALREADY_REFUNDED" };
  }

  if (payment.status !== "confirmed") {
    return { ok: false, error: "NOT_CONFIRMED" };
  }

  const notes =
    parsed.data.notes !== undefined ? parsed.data.notes : payment.notes;

  await updatePaymentRepo(config, payment.id, {
    status: "refunded",
    notes,
  });

  // v1: marcar payment_status en la orden; el operador cancela o gestiona stock manualmente.
  await updateOrderPaymentStatusRepo(config, payment.order_id, "refunded");

  return {
    ok: true,
    data: { paymentId: payment.id, status: "refunded" },
  };
}
