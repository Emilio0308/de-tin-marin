import "server-only";

import { storeFeatures } from "@de-tin-marin/config/store-features";
import {
  buildOrderCartWithTotals,
  collectProductIdsFromOrderLines,
  type OrderBundleSource,
} from "@de-tin-marin/shared/build-order-cart";
import {
  aggregateStockDemands,
  checkOrderStock,
} from "@de-tin-marin/shared/check-order-stock";
import { resolveCheckoutDeliveryFee } from "@de-tin-marin/shared/checkout-coverage";
import { formatOrderNumber } from "@de-tin-marin/shared/order-cart";
import type { OrderShoppingCartLine } from "@de-tin-marin/shared/order-cart";
import { resolveProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import { computeTotalBaseUnits } from "@de-tin-marin/shared/product-stock";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  createGuestOrderInputSchema,
  checkCartStockInputSchema,
  previewGuestCartInputSchema,
} from "@de-tin-marin/validations/checkout";
import { getPublicBundleByIdRepo } from "@/modules/catalog/repositories/bundle.repository";
import {
  getPublicProductsByIdsRepo,
  type PublicProductRow,
} from "@/modules/catalog/repositories/product.repository";
import { getActiveContainersByIdsRepo } from "@/modules/catalog/repositories/surprise-container.repository";
import {
  getWizardContainerStockByIdsRepo,
  getWizardProductStockByIdsRepo,
} from "@/modules/bundle-wizard/repositories/wizard-stock.repository";
import { listWizardCampaignsByIdsRepo } from "@/modules/bundle-wizard/repositories/wizard-product.repository";
import { getWizardProductsByIdsRepo } from "@/modules/bundle-wizard/repositories/wizard-product.repository";
import {
  asJson,
  countGuestOrdersByDatePrefixRepo,
  insertGuestOrderRepo,
} from "../repositories/order.repository";
import {
  getDeliverySettingsRepo,
  listActiveDeliveryZonesRepo,
} from "../repositories/delivery.repository";

async function resolveBundlesById(
  config: SupabaseConfig,
  lines: Parameters<typeof collectProductIdsFromOrderLines>[0],
): Promise<Map<string, OrderBundleSource>> {
  const bundlesById = new Map<string, OrderBundleSource>();

  for (const line of lines) {
    if (line.type !== "bundle" || bundlesById.has(line.bundleId)) {
      continue;
    }

    const bundle = await getPublicBundleByIdRepo(config, line.bundleId);
    if (!bundle) continue;

    const containers = await getActiveContainersByIdsRepo(config, [
      bundle.container_id,
    ]);
    const containerRow = containers[0];
    if (!containerRow) continue;

    bundlesById.set(line.bundleId, {
      id: bundle.id,
      name: bundle.name,
      is_active: bundle.is_active,
      deleted_at: bundle.deleted_at,
      container: {
        id: containerRow.id,
        sku: containerRow.sku,
        name: containerRow.name,
        prices: containerRow.prices,
      },
    });
  }

  return bundlesById;
}

function validateProductPurchaseQuantities(
  lines: { type: string; productId?: string; quantity?: number }[],
  catalogProducts: PublicProductRow[],
): boolean {
  const productsById = new Map(catalogProducts.map((row) => [row.id, row]));

  for (const line of lines) {
    if (line.type !== "product" || !line.productId || line.quantity == null) {
      continue;
    }

    const product = productsById.get(line.productId);
    if (!product) return false;

    const itemsPerPackage = product.items_per_package ?? 1;
    const stockTotalBaseUnits = computeTotalBaseUnits(
      product.stock_sealed_packages,
      product.stock_loose_base_units,
      itemsPerPackage,
    );
    const bounds = resolveProductPurchaseBounds({
      productType: (product.product_type as "unit" | "package") ?? "unit",
      itemsPerPackage,
      stockTotalBaseUnits,
      purchaseMinQuantity: product.purchase_min_quantity ?? 10,
      purchaseMaxQuantity: product.purchase_max_quantity ?? 100,
    });

    if (
      !bounds.purchasable ||
      line.quantity < bounds.minQuantity ||
      line.quantity > bounds.maxQuantity
    ) {
      return false;
    }
  }

  return true;
}

export async function checkCartStockService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: ReturnType<typeof checkOrderStock> }
  | { ok: false; error: "VALIDATION" }
> {
  const parsed = checkCartStockInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const shoppingCart = { lines: parsed.data.lines };
  const { products, containers } = aggregateStockDemands(shoppingCart);

  const [productStockRows, containerStockRows] = await Promise.all([
    getWizardProductStockByIdsRepo(config, [...products.keys()]),
    getWizardContainerStockByIdsRepo(config, [...containers.keys()]),
  ]);

  const productsById = new Map(
    productStockRows.map((product) => [
      product.id,
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        stockSealedPackages: product.stock_sealed_packages,
        stockLooseBaseUnits: product.stock_loose_base_units,
        itemsPerPackage: product.items_per_package,
      },
    ]),
  );
  const containersById = new Map(
    containerStockRows.map((container) => [
      container.id,
      {
        id: container.id,
        sku: container.sku,
        name: container.name,
        stockQuantity: container.stock_quantity,
      },
    ]),
  );

  return {
    ok: true,
    data: checkOrderStock(shoppingCart, productsById, containersById),
  };
}

export async function previewGuestOrderCartService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | {
      ok: true;
      data: {
        subtotal: number;
        discountTotal: number;
        shippingTotal: number;
        total: number;
        lineTotals: number[];
        lines: OrderShoppingCartLine[];
      };
    }
  | {
      ok: false;
      error:
        | "VALIDATION"
        | "PRODUCT_NOT_FOUND"
        | "BUNDLE_NOT_FOUND"
        | "DUPLICATE_PRODUCT_IN_BUNDLE"
        | "INVALID_PURCHASE_QUANTITY";
    }
> {
  const parsed = previewGuestCartInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  if (parsed.data.lines.length === 0) {
    return {
      ok: true,
      data: {
        subtotal: 0,
        discountTotal: parsed.data.discountTotal,
        shippingTotal: parsed.data.shippingTotal,
        total: parsed.data.shippingTotal - parsed.data.discountTotal,
        lineTotals: [],
        lines: [],
      },
    };
  }

  const productIds = collectProductIdsFromOrderLines(parsed.data.lines);
  const [products, catalogProducts] = await Promise.all([
    getWizardProductsByIdsRepo(config, productIds),
    getPublicProductsByIdsRepo(config, productIds),
  ]);

  if (products.length !== productIds.length) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  if (products.some((product) => !product.is_active)) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  if (
    catalogProducts.length !== productIds.length ||
    !validateProductPurchaseQuantities(parsed.data.lines, catalogProducts)
  ) {
    return { ok: false, error: "INVALID_PURCHASE_QUANTITY" };
  }

  const campaignIds = [
    ...new Set(
      products
        .map((product) => product.campaign_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const campaigns = await listWizardCampaignsByIdsRepo(config, campaignIds);
  const bundlesById = await resolveBundlesById(config, parsed.data.lines);

  const cartResult = buildOrderCartWithTotals({
    lines: parsed.data.lines,
    products,
    campaigns,
    bundlesById,
    discountTotal: parsed.data.discountTotal,
    shippingTotal: parsed.data.shippingTotal,
  });

  if (!cartResult.ok) {
    if (cartResult.error === "DUPLICATE_PRODUCT_IN_BUNDLE") {
      return { ok: false, error: "DUPLICATE_PRODUCT_IN_BUNDLE" };
    }
    if (cartResult.error === "PRODUCT_NOT_FOUND") {
      return { ok: false, error: "PRODUCT_NOT_FOUND" };
    }
    return { ok: false, error: "BUNDLE_NOT_FOUND" };
  }

  return {
    ok: true,
    data: {
      subtotal: cartResult.totals.subtotal,
      discountTotal: cartResult.totals.discountTotal,
      shippingTotal: cartResult.totals.shippingTotal,
      total: cartResult.totals.total,
      lineTotals: cartResult.shoppingCart.lines.map((line) => line.lineTotal),
      lines: cartResult.shoppingCart.lines,
    },
  };
}

export async function createGuestOrderService(
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
        | "DUPLICATE_PRODUCT_IN_BUNDLE"
        | "OUT_OF_COVERAGE"
        | "INSUFFICIENT_STOCK"
        | "INVALID_PURCHASE_QUANTITY";
    }
> {
  const parsed = createGuestOrderInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const productIds = collectProductIdsFromOrderLines(parsed.data.lines);
  const [products, catalogProducts] = await Promise.all([
    getWizardProductsByIdsRepo(config, productIds),
    getPublicProductsByIdsRepo(config, productIds),
  ]);
  if (products.length !== productIds.length) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  if (products.some((product) => !product.is_active)) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  if (
    catalogProducts.length !== productIds.length ||
    !validateProductPurchaseQuantities(parsed.data.lines, catalogProducts)
  ) {
    return { ok: false, error: "INVALID_PURCHASE_QUANTITY" };
  }

  const campaignIds = [
    ...new Set(
      products
        .map((product) => product.campaign_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const campaigns = await listWizardCampaignsByIdsRepo(config, campaignIds);
  const bundlesById = await resolveBundlesById(config, parsed.data.lines);

  const [zones, settings] = await Promise.all([
    listActiveDeliveryZonesRepo(config),
    getDeliverySettingsRepo(config),
  ]);

  const deliveryResult = resolveCheckoutDeliveryFee(
    parsed.data.fulfillment.method,
    parsed.data.fulfillment.deliveryAddress?.district,
    parsed.data.mapPin,
    zones.map((zone) => ({
      district: zone.district,
      fee: Number(zone.fee),
      isActive: zone.is_active,
    })),
    {
      pickupEnabled: settings?.pickup_enabled ?? storeFeatures.pickupEnabled,
      deliveryEnabled: settings?.delivery_enabled ?? true,
      fallbackFee: Number(settings?.fallback_fee ?? 0),
    },
  );

  if (!deliveryResult.covered) {
    return { ok: false, error: "OUT_OF_COVERAGE" };
  }

  const cartResult = buildOrderCartWithTotals({
    lines: parsed.data.lines,
    products,
    campaigns,
    bundlesById,
    discountTotal: parsed.data.discountTotal,
    shippingTotal: deliveryResult.fee,
  });

  if (!cartResult.ok) {
    if (cartResult.error === "DUPLICATE_PRODUCT_IN_BUNDLE") {
      return { ok: false, error: "DUPLICATE_PRODUCT_IN_BUNDLE" };
    }
    return { ok: false, error: "BUNDLE_NOT_FOUND" };
  }

  const stockCheck = await checkCartStockService(config, {
    lines: cartResult.shoppingCart.lines,
  });
  if (stockCheck.ok && !stockCheck.data.ok) {
    return { ok: false, error: "INSUFFICIENT_STOCK" };
  }

  const { shoppingCart, totals } = cartResult;
  const datePrefix = formatOrderNumber(0).slice(0, 12);
  const sequence =
    (await countGuestOrdersByDatePrefixRepo(config, datePrefix)) + 1;
  const orderNumber = formatOrderNumber(sequence);

  const row = await insertGuestOrderRepo(config, {
    order_number: orderNumber,
    status: "pending_payment",
    payment_status: "pending",
    customer_id: null,
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
    metadata: asJson({ mapPin: parsed.data.mapPin }),
  });

  return { ok: true, data: { id: row.id, orderNumber: row.order_number } };
}
