import { mapPinSchema } from "@de-tin-marin/validations/checkout";
import type { MapPin } from "@de-tin-marin/validations/checkout";

export function parseOrderMapPin(
  metadata: Record<string, unknown>,
): MapPin | null {
  const parsed = mapPinSchema.safeParse(metadata.mapPin);
  return parsed.success ? parsed.data : null;
}
