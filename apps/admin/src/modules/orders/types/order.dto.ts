import type {
  OrderDetail,
  OrderListItem,
} from "@de-tin-marin/validations/order";
import {
  orderContactSchema,
  orderDetailSchema,
  orderShoppingCartProductLineSchema,
  orderShoppingCartBundleLineSchema,
} from "@de-tin-marin/validations/order";
import {
  aggregateStockDemands,
  checkOrderStock,
} from "@de-tin-marin/shared/check-order-stock";
import type { OrderShoppingCart } from "@de-tin-marin/shared/order-cart";
import type { OrderRow } from "../repositories/order.repository";
import {
  getContainerStockByIdsRepo,
  getProductStockByIdsRepo,
} from "../repositories/order.repository";
import { listPaymentsByOrderIdRepo } from "../repositories/payment.repository";
import { getShipmentByOrderIdRepo } from "../repositories/shipment.repository";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { parsePaymentSummary, parseShipmentDto } from "./payment-shipment.dto";

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
    payments: [],
    shipment: null,
  });

  if (!parsed.success) {
    throw new Error("INVALID_ORDER_ROW");
  }

  return parsed.data;
}

function parseShoppingCart(raw: unknown): OrderShoppingCart | null {
  if (!raw || typeof raw !== "object" || !("lines" in raw)) return null;
  const linesRaw = raw.lines;
  if (!Array.isArray(linesRaw)) return null;

  const lines: OrderShoppingCart["lines"] = [];
  for (const line of linesRaw) {
    if (!line || typeof line !== "object" || !("type" in line)) continue;
    if ((line as { type: string }).type === "product") {
      const parsed = orderShoppingCartProductLineSchema.safeParse(line);
      if (parsed.success) lines.push(parsed.data);
      continue;
    }
    if ((line as { type: string }).type === "bundle") {
      const parsed = orderShoppingCartBundleLineSchema.safeParse(line);
      if (parsed.success) lines.push(parsed.data);
    }
  }

  if (lines.length === 0) return null;
  return { lines };
}

async function buildOrderStockCheck(
  config: SupabaseConfig,
  shoppingCartRaw: unknown,
) {
  const cart = parseShoppingCart(shoppingCartRaw);
  if (!cart) return undefined;

  const { products, containers } = aggregateStockDemands(cart);
  const [productRows, containerRows] = await Promise.all([
    getProductStockByIdsRepo(config, [...products.keys()]),
    getContainerStockByIdsRepo(config, [...containers.keys()]),
  ]);

  const productsById = new Map(
    productRows.map((row) => [
      row.id,
      {
        id: row.id,
        sku: row.sku,
        name: row.name,
        stockSealedPackages: row.stock_sealed_packages,
        stockLooseBaseUnits: row.stock_loose_base_units,
        itemsPerPackage: row.items_per_package,
      },
    ]),
  );
  const containersById = new Map(
    containerRows.map((row) => [
      row.id,
      {
        id: row.id,
        sku: row.sku,
        name: row.name,
        stockQuantity: row.stock_quantity,
      },
    ]),
  );

  return checkOrderStock(cart, productsById, containersById);
}

export async function parseOrderDetailWithRelations(
  config: SupabaseConfig,
  row: OrderRow,
): Promise<OrderDetail> {
  const [payments, shipment, stockCheck] = await Promise.all([
    listPaymentsByOrderIdRepo(config, row.id),
    getShipmentByOrderIdRepo(config, row.id),
    row.status === "pending_payment"
      ? buildOrderStockCheck(config, row.shopping_cart)
      : Promise.resolve(undefined),
  ]);

  const base = parseOrderDetail(row);
  return {
    ...base,
    payments: payments.map(parsePaymentSummary),
    shipment: shipment ? parseShipmentDto(shipment) : null,
    stockCheck,
  };
}
