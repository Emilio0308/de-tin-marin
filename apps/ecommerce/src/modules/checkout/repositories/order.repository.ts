import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database, Json } from "@de-tin-marin/types/database";
import { logServerError } from "@/shared/errors/server-error";

export type GuestOrderRow = Database["commerce"]["Tables"]["orders"]["Row"];
export type GuestOrderInsert =
  Database["commerce"]["Tables"]["orders"]["Insert"];

export type InsertGuestOrderRpcInput = {
  contact: Json;
  fulfillment: Json;
  shoppingCart: Json;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  pricingSnapshot: Json;
  metadata: Json;
};

export type InsertGuestOrderRpcResult = {
  id: string;
  orderNumber: string;
};

function parseInsertGuestOrderPayload(
  data: unknown,
): InsertGuestOrderRpcResult | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const id = record.id;
  const orderNumber = record.orderNumber;
  if (typeof id !== "string" || typeof orderNumber !== "string") {
    return null;
  }

  return { id, orderNumber };
}

export async function insertGuestOrderRepo(
  config: SupabaseConfig,
  input: InsertGuestOrderRpcInput,
): Promise<InsertGuestOrderRpcResult> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase.schema("commerce").rpc("insert_guest_order", {
    p_contact: input.contact,
    p_fulfillment: input.fulfillment,
    p_shopping_cart: input.shoppingCart,
    p_subtotal: input.subtotal,
    p_discount_total: input.discountTotal,
    p_shipping_total: input.shippingTotal,
    p_total: input.total,
    p_pricing_snapshot: input.pricingSnapshot,
    p_metadata: input.metadata,
  });

  if (result.error) {
    logServerError("insertGuestOrderRepo", {
      message: result.error.message,
      code: result.error.code,
      details: result.error.details,
      hint: result.error.hint,
    });
    throw new Error(
      result.error.message ||
        `insert_guest_order failed (${result.error.code ?? "unknown"})`,
    );
  }

  const rawData: unknown = result.data;
  const payload = parseInsertGuestOrderPayload(rawData);
  if (!payload) {
    logServerError("insertGuestOrderRepo", {
      message: "RPC returned unexpected payload",
      data: rawData,
    });
    throw new Error("insert_guest_order returned invalid payload");
  }

  return payload;
}

export function asJson(value: unknown): Json {
  return value as Json;
}
