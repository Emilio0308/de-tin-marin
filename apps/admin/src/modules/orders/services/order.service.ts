import "server-only";

import {
  buildOrderCartWithTotals,
  collectPackIdsFromOrderLines,
  collectProductIdsFromOrderLines,
  type OrderBundleSource,
  type OrderPackSource,
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
import { zodIssuesToFieldErrors } from "../helpers/order-form-validation";
import {
  adminOrderListQuerySchema,
  type AdminListPage,
} from "@de-tin-marin/validations/admin-list";
import { getBundleByIdRepo } from "@/modules/catalog/repositories/bundle.repository";
import { getPackByIdRepo } from "@/modules/catalog/repositories/pack.repository";
import { listCampaignsByIdsRepo } from "@/modules/catalog/repositories/product.repository";
import { resolveDeliveryFeeService } from "@/modules/delivery/services/delivery.service";
import {
  asJson,
  countOrdersByDatePrefixRepo,
  getOrderByIdRepo,
  getOrderProductsByIdsRepo,
  insertOrderRepo,
  listOrdersPageRepo,
  listOrdersRepo,
  updateOrderStatusRepo,
  type OrderRow,
} from "../repositories/order.repository";
import {
  parseOrderDetailWithRelations,
  type OrderDetail,
  type OrderListItem,
} from "../types/order.dto";

async function resolveBundlesById(
  config: SupabaseConfig,
  lines: Parameters<typeof collectProductIdsFromOrderLines>[0],
): Promise<Map<string, OrderBundleSource>> {
  const bundleIds = [
    ...new Set(
      lines
        .filter((line) => line.type === "bundle")
        .map((line) => line.bundleId),
    ),
  ];

  const rows = await Promise.all(
    bundleIds.map((bundleId) => getBundleByIdRepo(config, bundleId)),
  );

  const bundlesById = new Map<string, OrderBundleSource>();
  for (const bundle of rows) {
    if (!bundle) continue;
    const containerRow = bundle.surprise_containers;
    bundlesById.set(bundle.id, {
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

async function resolvePacksById(
  config: SupabaseConfig,
  lines: Parameters<typeof collectProductIdsFromOrderLines>[0],
): Promise<Map<string, OrderPackSource>> {
  const packIds = collectPackIdsFromOrderLines(lines);
  const rows = await Promise.all(
    packIds.map((packId) => getPackByIdRepo(config, packId)),
  );

  const packsById = new Map<string, OrderPackSource>();
  for (const pack of rows) {
    if (!pack) continue;
    packsById.set(pack.id, {
      id: pack.id,
      sku: pack.sku,
      name: pack.name,
      prices: pack.prices,
      campaign_id: pack.campaign_id,
      image_url: pack.image_url,
      is_active: pack.is_active,
      deleted_at: pack.deleted_at,
      items: (pack.pack_items ?? []).map((item) => ({
        product_id: item.product_id,
        package_quantity: item.package_quantity,
        unit_quantity: item.unit_quantity ?? 0,
      })),
    });
  }

  return packsById;
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

export async function listOrdersPageService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: AdminListPage<OrderListItem> }
  | { ok: false; error: "VALIDATION" }
> {
  const parsed = adminOrderListQuerySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const { page, pageSize } = parsed.data;
  const { rows, total } = await listOrdersPageRepo(config, { page, pageSize });

  return {
    ok: true,
    data: {
      items: rows.map(toListItem),
      page,
      pageSize,
      total,
    },
  };
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
        | "PACK_NOT_FOUND"
        | "DUPLICATE_PRODUCT_IN_BUNDLE";
      fieldErrors?: Record<string, string>;
    }
> {
  const parsed = createOrderInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "VALIDATION",
      fieldErrors: zodIssuesToFieldErrors(parsed.error.issues),
    };
  }

  const packsById = await resolvePacksById(config, parsed.data.lines);
  for (const line of parsed.data.lines) {
    if (line.type === "pack" && !packsById.has(line.packId)) {
      return { ok: false, error: "PACK_NOT_FOUND" };
    }
  }

  const productIds = collectProductIdsFromOrderLines(
    parsed.data.lines,
    packsById,
  );
  const products = await getOrderProductsByIdsRepo(config, productIds);
  if (products.length !== productIds.length) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  const campaignIds = [
    ...products
      .map((product) => product.campaign_id)
      .filter((id): id is string => Boolean(id)),
    ...[...packsById.values()]
      .map((pack) => pack.campaign_id)
      .filter((id): id is string => Boolean(id)),
  ];
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
    packsById,
    discountTotal: parsed.data.discountTotal,
    surchargeTotal: parsed.data.surchargeTotal,
    shippingTotal,
  });

  if (!cartResult.ok) {
    return { ok: false, error: cartResult.error };
  }

  const { shoppingCart, totals } = cartResult;

  if (totals.total < 0) {
    return { ok: false, error: "VALIDATION" };
  }

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
    surcharge_total: totals.surchargeTotal,
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
