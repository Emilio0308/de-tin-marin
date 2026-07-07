import { z } from "zod";

export const deliveryZoneInputSchema = z.object({
  id: z.string().uuid().optional(),
  district: z.string().min(1).max(120),
  fee: z.number().nonnegative(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const deliverySettingsSchema = z.object({
  pickupEnabled: z.boolean(),
  deliveryEnabled: z.boolean(),
  fallbackFee: z.number().nonnegative(),
});

export const resolveDeliveryFeeInputSchema = z.object({
  method: z.enum(["delivery", "pickup"]),
  district: z.string().max(120).optional(),
});

export type DeliveryZoneInput = z.infer<typeof deliveryZoneInputSchema>;
export type DeliverySettingsInput = z.infer<typeof deliverySettingsSchema>;
