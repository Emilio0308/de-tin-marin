import { z } from "zod";
import {
  createOrderInputSchema,
  orderShoppingCartBundleLineSchema,
  orderShoppingCartPackLineSchema,
  orderShoppingCartProductLineSchema,
  previewOrderCartInputSchema,
} from "./order";

export const mapPinSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const createGuestOrderInputSchema = createOrderInputSchema
  .extend({
    mapPin: mapPinSchema,
  })
  .superRefine((value, ctx) => {
    if (value.fulfillment.method === "delivery") {
      if (!value.fulfillment.deliveryAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "deliveryAddress is required for delivery",
          path: ["fulfillment", "deliveryAddress"],
        });
      }
    }
  });

export const resolveCheckoutDeliveryFeeInputSchema = z.object({
  district: z.string().min(1).max(120),
  mapPin: mapPinSchema,
});

export const checkCartStockInputSchema = z.object({
  lines: z.array(
    z.discriminatedUnion("type", [
      orderShoppingCartProductLineSchema,
      orderShoppingCartBundleLineSchema,
      orderShoppingCartPackLineSchema,
    ]),
  ),
});

/** Preview de carrito guest: mismas líneas que create order, sin contacto/envío. */
export const previewGuestCartInputSchema = previewOrderCartInputSchema;

/** Snapshot completo del carrito (con precios) para validar drift en checkout. */
export const validateGuestCheckoutCartInputSchema = z.object({
  lines: z.array(
    z.discriminatedUnion("type", [
      orderShoppingCartProductLineSchema,
      orderShoppingCartBundleLineSchema,
      orderShoppingCartPackLineSchema,
    ]),
  ),
});

export type CreateGuestOrderInput = z.infer<typeof createGuestOrderInputSchema>;
export type ResolveCheckoutDeliveryFeeInput = z.infer<
  typeof resolveCheckoutDeliveryFeeInputSchema
>;
export type CheckCartStockInput = z.infer<typeof checkCartStockInputSchema>;
export type PreviewGuestCartInput = z.infer<typeof previewGuestCartInputSchema>;
export type ValidateGuestCheckoutCartInput = z.infer<
  typeof validateGuestCheckoutCartInputSchema
>;
export type MapPin = z.infer<typeof mapPinSchema>;
