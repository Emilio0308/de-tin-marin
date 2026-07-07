import "server-only";

import {
  confirmPaymentInputSchema,
  refundPaymentInputSchema,
} from "@de-tin-marin/validations/payment";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  getPaymentByIdRepo,
  confirmPaymentWithStockDeductRepo,
  updatePaymentRepo,
} from "../repositories/payment.repository";
import { updateOrderPaymentStatusRepo } from "../repositories/order.repository";

type ConfirmPaymentError =
  | "VALIDATION"
  | "NOT_FOUND"
  | "ORDER_NOT_PENDING"
  | "ALREADY_CONFIRMED"
  | "INSUFFICIENT_STOCK"
  | "FORBIDDEN";

type InsufficientStockDetails = {
  kind: "product" | "container";
  sku: string;
};

function parseConfirmPaymentError(message: string): {
  error: ConfirmPaymentError;
  details?: InsufficientStockDetails;
} {
  if (message.includes("INSUFFICIENT_STOCK")) {
    const match = message.match(/INSUFFICIENT_STOCK:(product|container):(.+)/);
    return {
      error: "INSUFFICIENT_STOCK",
      details:
        match && match[2]
          ? {
              kind: match[1] as InsufficientStockDetails["kind"],
              sku: match[2],
            }
          : undefined,
    };
  }
  if (message.includes("NOT_FOUND")) return { error: "NOT_FOUND" };
  if (message.includes("ORDER_NOT_PENDING"))
    return { error: "ORDER_NOT_PENDING" };
  if (message.includes("ALREADY_CONFIRMED"))
    return { error: "ALREADY_CONFIRMED" };
  if (message.includes("FORBIDDEN")) return { error: "FORBIDDEN" };
  return { error: "NOT_FOUND" };
}

export async function confirmPaymentService(
  config: SupabaseConfig,
  staffUserId: string,
  raw: unknown,
): Promise<
  | { ok: true; data: { orderId: string; paymentId: string; status: "paid" } }
  | {
      ok: false;
      error: ConfirmPaymentError;
      details?: InsufficientStockDetails;
    }
> {
  const parsed = confirmPaymentInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  try {
    const data = await confirmPaymentWithStockDeductRepo(config, {
      orderId: parsed.data.orderId,
      staffUserId,
      notes: parsed.data.notes ?? null,
      paymentReference: parsed.data.paymentReference ?? null,
    });

    return {
      ok: true,
      data: {
        orderId: data.orderId,
        paymentId: data.paymentId,
        status: "paid",
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const parsedError = parseConfirmPaymentError(message);
    return {
      ok: false,
      error: parsedError.error,
      details: parsedError.details,
    };
  }
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
