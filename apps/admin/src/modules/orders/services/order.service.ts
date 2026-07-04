import "server-only";

import {
  computeFinalPrice,
  toCampaignForPricing,
} from "@de-tin-marin/shared/final-price";
import {
  buildShoppingCart,
  canTransitionOrderStatus,
  computeOrderTotals,
  formatOrderNumber,
  type OrderStatus,
} from "@de-tin-marin/shared/order-cart";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  createOrderInputSchema,
  transitionOrderStatusInputSchema,
} from "@de-tin-marin/validations/order";
import { getBundleByIdRepo } from "@/modules/catalog/repositories/bundle.repository";
import {
  listCampaignsByIdsRepo,
  parsePricesJson,
} from "@/modules/catalog/repositories/product.repository";
import {
  asJson,
  countOrdersByDatePrefixRepo,
  getOrderByIdRepo,
  getOrderProductsByIdsRepo,
  insertOrderRepo,
  listOrdersRepo,
  updateOrderStatusRepo,
  type OrderRow,
} from "../repositories/order.repository";
import {
  parseOrderDetailWithRelations,
  type OrderDetail,
  type OrderListItem,
} from "../types/order.dto";

function collectProductIds(
  lines: Array<
    | { type: "product"; productId: string }
    | { type: "bundle"; components: Array<{ productId: string }> }
  >,
): string[] {
  const ids = new Set<string>();
  for (const line of lines) {
    if (line.type === "product") {
      ids.add(line.productId);
      continue;
    }
    for (const component of line.components) {
      ids.add(component.productId);
    }
  }
  return [...ids];
}

function toListItem(row: OrderRow): OrderListItem {
  const contact = (row.contact ?? {}) as Record<string, string>;
  const shoppingCart = row.shopping_cart as { lines?: unknown[] };
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    customerName: `${contact.name ?? ""} ${contact.lastName ?? ""}`.trim(),
    total: Number(row.total),
    lineCount: shoppingCart.lines?.length ?? 0,
    createdAt: row.created_at,
  };
}

export async function listOrdersService(
  config: SupabaseConfig,
): Promise<{ ok: true; data: OrderListItem[] }> {
  const rows = await listOrdersRepo(config);
  return { ok: true, data: rows.map(toListItem) };
}

export async function getOrderService(
  config: SupabaseConfig,
  id: string,
): Promise<
  | { ok: true; data: OrderDetail }
  | { ok: false; error: "NOT_FOUND" | "INVALID_ORDER_ROW" }
> {
  const row = await getOrderByIdRepo(config, id);
  if (!row) return { ok: false, error: "NOT_FOUND" };

  try {
    const data = await parseOrderDetailWithRelations(config, row);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "INVALID_ORDER_ROW" };
  }
}

export async function createOrderService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: { id: string; orderNumber: string } }
  | {
      ok: false;
      error:
        | "VALIDATION"
        | "PRODUCT_NOT_FOUND"
        | "BUNDLE_NOT_FOUND"
        | "DUPLICATE_PRODUCT_IN_BUNDLE";
    }
> {
  const parsed = createOrderInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const productIds = collectProductIds(parsed.data.lines);
  const products = await getOrderProductsByIdsRepo(config, productIds);
  if (products.length !== productIds.length) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  const campaignIds = products
    .map((product) => product.campaign_id)
    .filter((id): id is string => Boolean(id));
  const campaigns = await listCampaignsByIdsRepo(config, campaignIds);
  const campaignsById = new Map(
    campaigns.map((campaign) => [campaign.id, campaign]),
  );

  const productsById = new Map(
    products.map((product) => {
      const { netPrice } = parsePricesJson(product.prices);
      const campaignRow = product.campaign_id
        ? (campaignsById.get(product.campaign_id) ?? null)
        : null;
      const unitPrice = computeFinalPrice(
        netPrice,
        campaignRow ? toCampaignForPricing(campaignRow) : null,
      );
      return [
        product.id,
        {
          id: product.id,
          sku: product.sku,
          name: product.name,
          unitPrice,
        },
      ] as const;
    }),
  );

  const buildLines: Array<
    | { type: "product"; productId: string; quantity: number }
    | {
        type: "bundle";
        bundleId: string;
        name: string;
        quantity: number;
        serviceFee: number;
        components: Array<{ productId: string; quantityPerUnit: number }>;
      }
  > = [];

  for (const line of parsed.data.lines) {
    if (line.type === "product") {
      buildLines.push(line);
      continue;
    }

    const bundle = await getBundleByIdRepo(config, line.bundleId);
    if (!bundle || !bundle.is_active || bundle.deleted_at) {
      return { ok: false, error: "BUNDLE_NOT_FOUND" };
    }

    const componentIds = line.components.map((item) => item.productId);
    if (new Set(componentIds).size !== componentIds.length) {
      return { ok: false, error: "DUPLICATE_PRODUCT_IN_BUNDLE" };
    }

    buildLines.push({
      type: "bundle",
      bundleId: line.bundleId,
      name: bundle.name,
      quantity: line.quantity,
      serviceFee: Number(bundle.service_fee),
      components: line.components,
    });
  }

  let shoppingCart;
  try {
    shoppingCart = buildShoppingCart({ lines: buildLines, productsById });
  } catch {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  const totals = computeOrderTotals(shoppingCart, {
    discountTotal: parsed.data.discountTotal,
    shippingTotal: parsed.data.shippingTotal,
  });

  const datePrefix = formatOrderNumber(0).slice(0, 12);
  const sequence = (await countOrdersByDatePrefixRepo(config, datePrefix)) + 1;
  const orderNumber = formatOrderNumber(sequence);

  const row = await insertOrderRepo(config, {
    order_number: orderNumber,
    status: "pending_payment",
    payment_status: "pending",
    contact: asJson(parsed.data.contact),
    fulfillment: asJson(parsed.data.fulfillment),
    shopping_cart: asJson(shoppingCart),
    payment_methods: asJson([]),
    subtotal: totals.subtotal,
    discount_total: totals.discountTotal,
    shipping_total: totals.shippingTotal,
    total: totals.total,
    pricing_snapshot: asJson(totals),
    currency_code: "PEN",
    metadata: asJson({}),
  });

  return { ok: true, data: { id: row.id, orderNumber: row.order_number } };
}

export async function transitionOrderStatusService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: { id: string; status: OrderStatus } }
  | {
      ok: false;
      error:
        | "VALIDATION"
        | "NOT_FOUND"
        | "INVALID_TRANSITION"
        | "PAYMENT_CONFIRMATION_REQUIRED";
    }
> {
  const parsed = transitionOrderStatusInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const row = await getOrderByIdRepo(config, parsed.data.id);
  if (!row) return { ok: false, error: "NOT_FOUND" };

  const from = row.status as OrderStatus;
  const to = parsed.data.status;

  if (to === "paid") {
    return { ok: false, error: "PAYMENT_CONFIRMATION_REQUIRED" };
  }

  if (!canTransitionOrderStatus(from, to)) {
    return { ok: false, error: "INVALID_TRANSITION" };
  }

  const updated = await updateOrderStatusRepo(config, parsed.data.id, to);
  return { ok: true, data: { id: updated.id, status: to } };
}

export async function cancelOrderService(config: SupabaseConfig, id: string) {
  return transitionOrderStatusService(config, { id, status: "cancelled" });
}
