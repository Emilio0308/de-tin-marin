import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

export type PaymentRow = Database["commerce"]["Tables"]["payments"]["Row"];
export type PaymentInsert =
  Database["commerce"]["Tables"]["payments"]["Insert"];

export async function listPaymentsByOrderIdRepo(
  config: SupabaseConfig,
  orderId: string,
): Promise<PaymentRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []) as PaymentRow[];
}

export async function getPaymentByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<PaymentRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("payments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as PaymentRow | null;
}

export async function insertPaymentRepo(
  config: SupabaseConfig,
  row: PaymentInsert,
): Promise<PaymentRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("payments")
    .insert(row)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as PaymentRow;
}

export async function updatePaymentRepo(
  config: SupabaseConfig,
  id: string,
  patch: Database["commerce"]["Tables"]["payments"]["Update"],
): Promise<PaymentRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("payments")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as PaymentRow;
}

export type ConfirmPaymentRpcResult = {
  orderId: string;
  paymentId: string;
  status: "paid";
};

export async function confirmPaymentWithStockDeductRepo(
  config: SupabaseConfig,
  input: {
    orderId: string;
    staffUserId: string;
    notes?: string | null;
    paymentReference?: string | null;
  },
): Promise<ConfirmPaymentRpcResult> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .rpc("confirm_payment_with_stock_deduct", {
      p_order_id: input.orderId,
      p_staff_user_id: input.staffUserId,
      p_notes: input.notes ?? null,
      p_payment_reference: input.paymentReference ?? null,
    });

  if (result.error) throw new Error(result.error.message);
  return result.data as ConfirmPaymentRpcResult;
}
