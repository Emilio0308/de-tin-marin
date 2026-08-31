import { z } from "zod";
import { courierSnapshotSchema } from "./courier";
import { paymentSummarySchema } from "./payment";
import { pickupPointSnapshotSchema } from "./pickup-point";
import { shipmentDtoSchema } from "./shipment";

export const orderFulfillmentMethodSchema = z.enum([
  "delivery",
  "pickup",
  "pickup_point",
  "courier",
]);

export const orderContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .min(2)
    .max(200)
    .regex(/^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u),
  lastName: z
    .string()
    .trim()
    .min(1)
    .min(2)
    .max(200)
    .regex(/^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u),
  phone: z
    .string()
    .trim()
    .regex(/^9\d{8}$/),
  email: z.string().trim().email().max(320),
});

export const deliveryAddressSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .min(1)
    .min(2)
    .max(200)
    .regex(/^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u),
  line1: z.string().trim().min(1).min(5).max(300),
  district: z.string().trim().min(1).max(120),
  city: z
    .string()
    .trim()
    .min(1)
    .min(2)
    .max(120)
    .regex(/^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u),
  province: z
    .string()
    .trim()
    .min(1)
    .min(2)
    .max(120)
    .regex(/^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u),
  reference: z.string().max(500).optional().nullable(),
  phone: z
    .string()
    .trim()
    .regex(/^9\d{8}$/),
});

function refineOrderFulfillment(
  value: {
    method: z.infer<typeof orderFulfillmentMethodSchema>;
    deliveryAddress?: z.infer<typeof deliveryAddressSchema>;
    pickupPoint?: z.infer<typeof pickupPointSnapshotSchema>;
    courier?: z.infer<typeof courierSnapshotSchema>;
  },
  ctx: z.RefinementCtx,
) {
  if (value.method === "delivery") {
    if (!value.deliveryAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "deliveryAddress is required for delivery",
        path: ["deliveryAddress"],
      });
    }
    if (value.pickupPoint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "pickupPoint is not allowed for delivery",
        path: ["pickupPoint"],
      });
    }
    if (value.courier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "courier is not allowed for delivery",
        path: ["courier"],
      });
    }
    return;
  }

  if (value.method === "pickup_point") {
    if (!value.pickupPoint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "pickupPoint is required for pickup_point",
        path: ["pickupPoint"],
      });
    }
    if (value.deliveryAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "deliveryAddress is not allowed for pickup_point",
        path: ["deliveryAddress"],
      });
    }
    if (value.courier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "courier is not allowed for pickup_point",
        path: ["courier"],
      });
    }
    return;
  }

  if (value.method === "courier") {
    if (!value.courier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "courier is required for courier method",
        path: ["courier"],
      });
    }
    if (value.deliveryAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "deliveryAddress is not allowed for courier",
        path: ["deliveryAddress"],
      });
    }
    if (value.pickupPoint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "pickupPoint is not allowed for courier",
        path: ["pickupPoint"],
      });
    }
    return;
  }

  if (value.deliveryAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "deliveryAddress is not allowed for pickup",
      path: ["deliveryAddress"],
    });
  }
  if (value.pickupPoint) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "pickupPoint is not allowed for pickup",
      path: ["pickupPoint"],
    });
  }
  if (value.courier) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "courier is not allowed for pickup",
      path: ["courier"],
    });
  }
}

export const orderFulfillmentSchema = z
  .object({
    method: orderFulfillmentMethodSchema,
    deliveryAddress: deliveryAddressSchema.optional(),
    pickupPoint: pickupPointSnapshotSchema.optional(),
    courier: courierSnapshotSchema.optional(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .superRefine(refineOrderFulfillment);

export const guestOrderFulfillmentSchema = z
  .object({
    method: z.enum(["delivery", "pickup_point", "courier"]),
    deliveryAddress: deliveryAddressSchema.optional(),
    pickupPoint: pickupPointSnapshotSchema.optional(),
    courier: courierSnapshotSchema.optional(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .superRefine(refineOrderFulfillment);

export const orderProductLineInputSchema = z.object({
  type: z.literal("product"),
  productId: z.string().uuid(),
  packageQuantity: z.number().int().min(0),
  unitQuantity: z.number().int().min(0),
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

export const orderPackLineInputSchema = z.object({
  type: z.literal("pack"),
  packId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const createOrderInputObjectSchema = z.object({
  contact: orderContactSchema,
  fulfillment: orderFulfillmentSchema,
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

export { createOrderInputObjectSchema };

function refineProductLineDualQuantities(
  value: {
    lines: Array<{
      type: string;
      packageQuantity?: number;
      unitQuantity?: number;
    }>;
  },
  ctx: z.RefinementCtx,
) {
  value.lines.forEach((line, index) => {
    if (
      line.type === "product" &&
      (line.packageQuantity ?? 0) + (line.unitQuantity ?? 0) < 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "packageQuantity + unitQuantity must be >= 1",
        path: ["lines", index, "packageQuantity"],
      });
    }
  });
}

export const createOrderInputSchema = createOrderInputObjectSchema.superRefine(
  refineProductLineDualQuantities,
);

export const previewOrderCartInputSchema = createOrderInputObjectSchema
  .pick({
    lines: true,
    shippingTotal: true,
    discountTotal: true,
    surchargeTotal: true,
  })
  .superRefine(refineProductLineDualQuantities);

export const transitionOrderStatusInputSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum([
      "pending_payment",
      "paid",
      "preparing",
      "ready",
      "awaiting_pickup",
      "in_transit",
      "delivered",
      "completed",
      "cancelled",
    ]),
    shipment: z
      .object({
        carrier: z.string().trim().min(1).max(200),
        trackingNumber: z.string().trim().min(1).max(200),
        notes: z.string().max(1000).optional().nullable(),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "in_transit" && !value.shipment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SHIPMENT_REQUIRED",
        path: ["shipment"],
      });
    }
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
  packageQuantity: z.number(),
  unitQuantity: z.number(),
  packagePrice: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  imageUrl: z.string().nullable().optional(),
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
  normalizedPerSurprisePrice: z.number().optional(),
  normalizedLineTotal: z.number().optional(),
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
  imageUrl: z.string().nullable().optional(),
});

export const orderShoppingCartPackLineSchema = z.object({
  type: z.literal("pack"),
  packId: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  components: z.array(
    z.object({
      productId: z.string().uuid(),
      productName: z.string(),
      sku: z.string(),
      packageQuantity: z.number(),
      unitQuantity: z.number().default(0),
      totalPackages: z.number(),
      totalUnits: z.number().default(0),
    }),
  ),
  imageUrl: z.string().nullable().optional(),
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
        orderShoppingCartPackLineSchema,
      ]),
    ),
  }),
  status: z.string(),
  paymentStatus: z.string(),
  paymentMethods: z.array(z.unknown()),
  subtotal: z.number(),
  discountTotal: z.number(),
  surchargeTotal: z.number(),
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
export type PreviewOrderCartInput = z.infer<typeof previewOrderCartInputSchema>;
export type TransitionOrderStatusInput = z.infer<
  typeof transitionOrderStatusInputSchema
>;
export type OrderListItem = z.infer<typeof orderListItemSchema>;
export type OrderDetail = z.infer<typeof orderDetailSchema>;
