import { z } from "zod";
import {
  BUNDLE_LINE_QUANTITY_MAX,
  BUNDLE_LINE_QUANTITY_MIN,
} from "./customize-bundle";
import {
  guestOrderFulfillmentSchema,
  orderContactSchema,
  orderProductLineInputSchema,
  orderBundleLineInputSchema,
  orderPackLineInputSchema,
  orderShoppingCartBundleLineSchema,
  orderShoppingCartPackLineSchema,
  orderShoppingCartProductLineSchema,
  previewOrderCartInputSchema,
} from "./order";

export const mapPinSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const guestOrderInputObjectSchema = z.object({
  contact: orderContactSchema,
  fulfillment: guestOrderFulfillmentSchema,
  lines: z
    .array(
      z.discriminatedUnion("type", [
        orderProductLineInputSchema,
        orderBundleLineInputSchema,
        orderPackLineInputSchema,
      ]),
    )
    .min(1),
  shippingTotal: z.number().nonnegative().default(0),
  discountTotal: z.number().nonnegative().default(0),
  surchargeTotal: z.number().nonnegative().default(0),
});

export const createGuestOrderInputSchema = guestOrderInputObjectSchema
  .extend({
    mapPin: mapPinSchema.optional(),
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
      if (!value.mapPin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "mapPin is required for delivery",
          path: ["mapPin"],
        });
      }
    }

    if (value.fulfillment.method === "pickup_point") {
      if (!value.fulfillment.pickupPoint) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "pickupPoint is required for pickup_point",
          path: ["fulfillment", "pickupPoint"],
        });
      }
    }

    if (value.fulfillment.method === "courier") {
      if (!value.fulfillment.courier) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "courier is required for courier method",
          path: ["fulfillment", "courier"],
        });
      }
      if (value.shippingTotal !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "shippingTotal must be 0 for courier",
          path: ["shippingTotal"],
        });
      }
    }

    value.lines.forEach((line, index) => {
      if (line.type === "product") {
        if (line.packageQuantity + line.unitQuantity < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "packageQuantity + unitQuantity must be >= 1",
            path: ["lines", index, "packageQuantity"],
          });
        }
        if (line.unitQuantity > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Guest checkout does not allow unitQuantity > 0",
            path: ["lines", index, "unitQuantity"],
          });
        }
      }

      if (line.type === "bundle") {
        if (
          line.quantity < BUNDLE_LINE_QUANTITY_MIN ||
          line.quantity > BUNDLE_LINE_QUANTITY_MAX
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `bundle quantity must be between ${BUNDLE_LINE_QUANTITY_MIN} and ${BUNDLE_LINE_QUANTITY_MAX}`,
            path: ["lines", index, "quantity"],
          });
        }
      }
    });
  });

export const resolveCheckoutFulfillmentFeeInputSchema = z
  .object({
    method: z.enum(["delivery", "pickup_point", "courier"]),
    district: z.string().max(120).optional(),
    mapPin: mapPinSchema.optional(),
    pickupPointId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    provinceSlug: z.string().max(80).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.method === "delivery") {
      if (!value.district?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "district is required for delivery",
          path: ["district"],
        });
      }
      if (!value.mapPin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "mapPin is required for delivery",
          path: ["mapPin"],
        });
      }
    }

    if (value.method === "pickup_point" && !value.pickupPointId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "pickupPointId is required for pickup_point",
        path: ["pickupPointId"],
      });
    }

    if (value.method === "courier") {
      if (!value.departmentId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "departmentId is required for courier",
          path: ["departmentId"],
        });
      }
      if (!value.provinceSlug?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "provinceSlug is required for courier",
          path: ["provinceSlug"],
        });
      }
    }
  });

/** @deprecated Use resolveCheckoutFulfillmentFeeInputSchema */
export const resolveCheckoutDeliveryFeeInputSchema =
  resolveCheckoutFulfillmentFeeInputSchema;

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
export type ResolveCheckoutFulfillmentFeeInput = z.infer<
  typeof resolveCheckoutFulfillmentFeeInputSchema
>;
export type ResolveCheckoutDeliveryFeeInput =
  ResolveCheckoutFulfillmentFeeInput;
export type CheckCartStockInput = z.infer<typeof checkCartStockInputSchema>;
export type PreviewGuestCartInput = z.infer<typeof previewGuestCartInputSchema>;
export type ValidateGuestCheckoutCartInput = z.infer<
  typeof validateGuestCheckoutCartInputSchema
>;
export type MapPin = z.infer<typeof mapPinSchema>;
