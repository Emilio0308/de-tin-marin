import type {
  OrderDetail,
  OrderListItem,
} from "@de-tin-marin/validations/order";
import {
  orderContactSchema,
  orderDetailSchema,
} from "@de-tin-marin/validations/order";
import type { OrderRow } from "../repositories/order.repository";

export type { OrderDetail, OrderListItem };

function readContact(row: OrderRow) {
  const parsed = orderContactSchema.safeParse(row.contact);
  if (parsed.success) return parsed.data;
  return { name: "", lastName: "", phone: "", email: "" };
}

export function parseOrderDetail(row: OrderRow): OrderDetail {
  const contact = readContact(row);
  const parsed = orderDetailSchema.safeParse({
    id: row.id,
    orderId: row.order_number,
    customer: {
      uid: row.customer_id,
      ...contact,
    },
    fulfillment: row.fulfillment,
    shoppingCart: row.shopping_cart,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethods: Array.isArray(row.payment_methods)
      ? row.payment_methods
      : [],
    subtotal: Number(row.subtotal),
    discountTotal: Number(row.discount_total),
    shippingTotal: Number(row.shipping_total),
    total: Number(row.total),
    currencyCode: "PEN",
    metadata:
      row.metadata &&
      typeof row.metadata === "object" &&
      !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
  });

  if (!parsed.success) {
    throw new Error("INVALID_ORDER_ROW");
  }

  return parsed.data;
}
