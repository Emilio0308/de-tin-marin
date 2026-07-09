import { z } from "zod";
import {
  orderFulfillmentSchema,
  orderShoppingCartBundleLineSchema,
  orderShoppingCartProductLineSchema,
} from "./order";

export const getGuestOrderInputSchema = z.object({
  orderNumber: z.string().trim().min(1).max(64),
  email: z.string().trim().email().max(320),
});

export const guestOrderDetailSchema = z.object({
  orderNumber: z.string(),
  status: z.string(),
  paymentStatus: z.string(),
  subtotal: z.coerce.number(),
  shippingTotal: z.coerce.number(),
  total: z.coerce.number(),
  createdAt: z.string(),
  fulfillment: orderFulfillmentSchema,
  shoppingCart: z.object({
    lines: z.array(
      z.discriminatedUnion("type", [
        orderShoppingCartProductLineSchema,
        orderShoppingCartBundleLineSchema,
      ]),
    ),
  }),
});

export type GetGuestOrderInput = z.infer<typeof getGuestOrderInputSchema>;
export type GuestOrderDetail = z.infer<typeof guestOrderDetailSchema>;
