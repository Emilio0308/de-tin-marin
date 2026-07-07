import { z } from "zod";
import { paymentSummarySchema } from "./payment";
import { shipmentDtoSchema } from "./shipment";

export const orderContactSchema = z.object({
  name: z.string().min(1).max(200),
  lastName: z.string().min(1).max(200),
  phone: z.string().min(1).max(50),
  email: z.string().email().max(320),
});

export const deliveryAddressSchema = z.object({
  recipientName: z.string().min(1).max(200),
  line1: z.string().min(1).max(300),
  district: z.string().min(1).max(120),
  city: z.string().min(1).max(120),
  province: z.string().min(1).max(120),
  reference: z.string().max(500).optional().nullable(),
  phone: z.string().min(1).max(50),
});

export const orderFulfillmentSchema = z
  .object({
    method: z.enum(["delivery", "pickup"]),
    deliveryAddress: deliveryAddressSchema.optional(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.method === "delivery" && !value.deliveryAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "deliveryAddress is required for delivery",
        path: ["deliveryAddress"],
      });
    }
  });

export const orderProductLineInputSchema = z.object({
  type: z.literal("product"),
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const orderBundleComponentInputSchema = z.object({
  productId: z.string().uuid(),
  quantityPerUnit: z.number().int().min(1).default(1),
});

export const orderBundleLineInputSchema = z.object({
  type: z.literal("bundle"),
  bundleId: z.string().uuid(),
  quantity: z.number().int().min(1),
  components: z.array(orderBundleComponentInputSchema).min(1),
});

export const createOrderInputSchema = z.object({
  contact: orderContactSchema,
  fulfillment: orderFulfillmentSchema,
  lines: z
    .array(
      z.discriminatedUnion("type", [
        orderProductLineInputSchema,
        orderBundleLineInputSchema,
      ]),
    )
    .min(1),
  shippingTotal: z.number().nonnegative().default(0),
  discountTotal: z.number().nonnegative().default(0),
});

export const transitionOrderStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "pending_payment",
    "paid",
    "preparing",
    "ready",
    "delivered",
    "completed",
    "cancelled",
  ]),
});

export const orderListItemSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  status: z.string(),
  paymentStatus: z.string(),
  customerName: z.string(),
  total: z.number(),
  lineCount: z.number(),
  createdAt: z.string(),
});

export const orderShoppingCartProductLineSchema = z.object({
  type: z.literal("product"),
  productId: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
});

export const orderShoppingCartBundleContainerSchema = z.object({
  containerId: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  unitPrice: z.number(),
});

export const orderShoppingCartBundleLineSchema = z.object({
  type: z.literal("bundle"),
  bundleId: z.string().uuid(),
  name: z.string(),
  quantity: z.number(),
  serviceFee: z.number().optional(),
  container: orderShoppingCartBundleContainerSchema.optional(),
  lineTotal: z.number(),
  components: z.array(
    z.object({
      productId: z.string().uuid(),
      productName: z.string(),
      sku: z.string(),
      quantityPerUnit: z.number(),
      totalQuantity: z.number(),
      unitPrice: z.number(),
    }),
  ),
});

export const orderStockShortageSchema = z.object({
  kind: z.enum(["product", "container"]),
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string().optional(),
  required: z.number(),
  available: z.number(),
});

export const orderStockCheckSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }),
  z.object({
    ok: z.literal(false),
    shortages: z.array(orderStockShortageSchema),
  }),
]);

export const orderDetailSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string(),
  customer: orderContactSchema.extend({ uid: z.string().uuid().nullable() }),
  fulfillment: orderFulfillmentSchema,
  shoppingCart: z.object({
    lines: z.array(
      z.discriminatedUnion("type", [
        orderShoppingCartProductLineSchema,
        orderShoppingCartBundleLineSchema,
      ]),
    ),
  }),
  status: z.string(),
  paymentStatus: z.string(),
  paymentMethods: z.array(z.unknown()),
  subtotal: z.number(),
  discountTotal: z.number(),
  shippingTotal: z.number(),
  total: z.number(),
  currencyCode: z.literal("PEN"),
  metadata: z.record(z.unknown()),
  createdAt: z.string(),
  payments: z.array(paymentSummarySchema),
  shipment: shipmentDtoSchema.nullable(),
  stockCheck: orderStockCheckSchema.optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type TransitionOrderStatusInput = z.infer<
  typeof transitionOrderStatusInputSchema
>;
export type OrderListItem = z.infer<typeof orderListItemSchema>;
export type OrderDetail = z.infer<typeof orderDetailSchema>;
