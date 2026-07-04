import { z } from "zod";

export const shipmentStatusSchema = z.enum(["pending", "shipped", "delivered"]);

export const upsertShipmentInputSchema = z.object({
  orderId: z.string().uuid(),
  status: shipmentStatusSchema,
  trackingNumber: z.string().max(200).optional().nullable(),
  carrier: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const shipmentDtoSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  status: shipmentStatusSchema,
  trackingNumber: z.string().nullable(),
  carrier: z.string().nullable(),
  shippedAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  notes: z.string().nullable(),
});

export type ShipmentStatus = z.infer<typeof shipmentStatusSchema>;
export type UpsertShipmentInput = z.infer<typeof upsertShipmentInputSchema>;
export type ShipmentDto = z.infer<typeof shipmentDtoSchema>;
