import "server-only";

import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  getGuestOrderInputSchema,
  type GuestOrderDetail,
} from "@de-tin-marin/validations/guest-order";
import { parseGuestOrderDto } from "../helpers/parse-guest-order-dto";
import { getGuestOrderRpcRepo } from "../repositories/guest-order.repository";

export type GetGuestOrderError = "VALIDATION" | "NOT_FOUND";

export async function getGuestOrderService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: GuestOrderDetail }
  | { ok: false; error: GetGuestOrderError }
> {
  const parsed = getGuestOrderInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION" };
  }

  const rawOrder = await getGuestOrderRpcRepo(
    config,
    parsed.data.orderNumber,
    parsed.data.email,
  );

  if (!rawOrder) {
    return { ok: false, error: "NOT_FOUND" };
  }

  const dto = parseGuestOrderDto(rawOrder);
  if (!dto) {
    return { ok: false, error: "NOT_FOUND" };
  }

  return { ok: true, data: dto };
}
