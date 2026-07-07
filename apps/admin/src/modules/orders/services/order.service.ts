import "server-only";

import {
  buildOrderCartWithTotals,
  collectProductIdsFromOrderLines,
  type OrderBundleSource,
} from "@de-tin-marin/shared/build-order-cart";
import {
  formatOrderNumber,
  canTransitionOrderStatus,
  type OrderStatus,
} from "@de-tin-marin/shared/order-cart";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  createOrderInputSchema,
  transitionOrderStatusInputSchema,
} from "@de-tin-marin/validations/order";
import { getBundleByIdRepo } from "@/modules/catalog/repositories/bundle.repository";
import { listCampaignsByIdsRepo } from "@/modules/catalog/repositories/product.repository";
import { resolveDeliveryFeeService } from "@/modules/delivery/services/delivery.service";
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
  lines: Parameters<typeof collectProductIdsFromOrderLines>[0],
): string[] {
  return collectProductIdsFromOrderLines(lines);
}

async function resolveBundlesById(
  config: SupabaseConfig,
  lines: Parameters<typeof collectProductIdsFromOrderLines>[0],
): Promise<Map<string, OrderBundleSource>> {
  const bundlesById = new Map<string, OrderBundleSource>();

  for (const line of lines) {
    if (line.type !== "bundle" || bundlesById.has(line.bundleId)) {
      continue;
    }

    const bundle = await getBundleByIdRepo(config, line.bundleId);
    if (!bundle) {
      continue;
    }

    const containerRow = bundle.surprise_containers;
    bundlesById.set(line.bundleId, {
      id: bundle.id,
      name: bundle.name,
      is_active: bundle.is_active,
      deleted_at: bundle.deleted_at,
      container: containerRow
        ? {
            id: containerRow.id,
            sku: containerRow.sku,
            name: containerRow.name,
            prices: containerRow.prices,
          }
        : null,
    });
  }

  return bundlesById;
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
  const bundlesById = await resolveBundlesById(config, parsed.data.lines);

  const shippingResult = await resolveDeliveryFeeService(config, {
    method: parsed.data.fulfillment.method,
    district: parsed.data.fulfillment.deliveryAddress?.district,
  });
  const shippingTotal =
    shippingResult.ok === true ? shippingResult.fee : parsed.data.shippingTotal;

  const cartResult = buildOrderCartWithTotals({
    lines: parsed.data.lines,
    products,
    campaigns,
    bundlesById,
    discountTotal: parsed.data.discountTotal,
    shippingTotal,
  });

  if (!cartResult.ok) {
    return { ok: false, error: cartResult.error };
  }

  const { shoppingCart, totals } = cartResult;

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
