import { z } from "zod";

export const pickupPointSnapshotSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  fee: z.number().nonnegative(),
});

export const pickupPointInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  fee: z.number().nonnegative(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const checkoutPickupPointSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  lat: z.number(),
  lng: z.number(),
  fee: z.number().nonnegative(),
});

export type PickupPointSnapshot = z.infer<typeof pickupPointSnapshotSchema>;
export type PickupPointInput = z.infer<typeof pickupPointInputSchema>;
export type CheckoutPickupPoint = z.infer<typeof checkoutPickupPointSchema>;
