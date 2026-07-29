import { guestOrderDetailSchema } from "@de-tin-marin/validations/guest-order";
import type { GuestOrderDetail } from "@de-tin-marin/validations/guest-order";

export function parseGuestOrderDto(raw: unknown): GuestOrderDetail | null {
  const parsed = guestOrderDetailSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}
