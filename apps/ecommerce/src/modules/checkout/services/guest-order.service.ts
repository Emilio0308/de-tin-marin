import "server-only";

import { storeFeatures } from "@de-tin-marin/config/store-features";
import {
  buildOrderCartWithTotals,
  collectPackIdsFromOrderLines,
  collectProductIdsFromOrderLines,
  type OrderBundleSource,
  type OrderPackSource,
} from "@de-tin-marin/shared/build-order-cart";
import {
  aggregateStockDemands,
  checkOrderStock,
} from "@de-tin-marin/shared/check-order-stock";
import { resolveCheckoutFulfillmentFee } from "@de-tin-marin/shared/checkout-coverage";
import type { OrderShoppingCartLine } from "@de-tin-marin/shared/order-cart";
import {
  computePackAvailableQuantity as computePackAvailableQuantityShared,
  type PackAvailabilityComponent,
} from "@de-tin-marin/shared/pack-availability";
import { resolveProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import { computeTotalBaseUnits } from "@de-tin-marin/shared/product-stock";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  createGuestOrderInputSchema,
  checkCartStockInputSchema,
  previewGuestCartInputSchema,
  validateGuestCheckoutCartInputSchema,
  type ValidateGuestCheckoutCartInput,
} from "@de-tin-marin/validations/checkout";
import {
  resolveBundleCustomizationBounds,
  validateOrderLinesBundleCustomization,
  type BundleCustomizationBounds,
} from "@de-tin-marin/validations/customize-bundle";
import { getPublicBundleByIdRepo } from "@/modules/catalog/repositories/bundle.repository";
import {
  getPublicPackByIdRepo,
  listPublicPackItemsByPackIdsRepo,
  type PublicPackItemRow,
} from "@/modules/catalog/repositories/pack.repository";
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
import { getPublicBusinessSettingsService } from "@/modules/business-settings/services/public-business-settings.service";
import { logServerError, logServerInfo } from "@/shared/errors/server-error";
import {
  mapCartLinesToNotifyLines,
  mapFulfillmentToNotify,
} from "@de-tin-marin/notifications/map-order-notify";
import { scheduleOrderCreatedNotification } from "../helpers/schedule-order-created-notification";
import { asJson, insertGuestOrderRepo } from "../repositories/order.repository";
import {
  getDeliverySettingsRepo,
  getPickupPointByIdRepo,
  listActiveDeliveryZonesRepo,
  listActivePickupPointsRepo,
} from "../repositories/delivery.repository";

async function resolveBundlesById(
  config: SupabaseConfig,
  lines: Parameters<typeof collectProductIdsFromOrderLines>[0],
): Promise<{
  bundlesById: Map<string, OrderBundleSource>;
  customizationBoundsById: Map<string, BundleCustomizationBounds>;
}> {
  const bundlesById = new Map<string, OrderBundleSource>();
  const customizationBoundsById = new Map<string, BundleCustomizationBounds>();

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
    customizationBoundsById.set(
      line.bundleId,
      resolveBundleCustomizationBounds({
        customizationMinProducts: bundle.customization_min_products,
        customizationMaxProducts: bundle.customization_max_products,
      }),
    );
  }

  return { bundlesById, customizationBoundsById };
}

function computePackAvailableQuantity(items: PublicPackItemRow[]): number {
  const components: PackAvailabilityComponent[] = items.map((item) => {
    const product = item.products;
    return {
      packageQuantity: item.package_quantity,
      unitQuantity: item.unit_quantity ?? 0,
      product: product
        ? {
            isActive: product.is_active,
            deletedAt: product.deleted_at,
            productType: (product.product_type as "unit" | "package") ?? "unit",
            itemsPerPackage: product.items_per_package ?? 1,
            stockSealedPackages: product.stock_sealed_packages,
            stockLooseBaseUnits: product.stock_loose_base_units,
          }
        : null,
    };
  });
  return computePackAvailableQuantityShared(components);
}

async function resolvePacksById(
  config: SupabaseConfig,
  lines: Parameters<typeof collectProductIdsFromOrderLines>[0],
): Promise<
  Map<
    string,
    OrderPackSource & {
      purchase_min_quantity: number;
      purchase_max_quantity: number;
      available_quantity: number;
    }
  >
> {
  const packsById = new Map<
    string,
    OrderPackSource & {
      purchase_min_quantity: number;
      purchase_max_quantity: number;
      available_quantity: number;
    }
  >();

  const packIds = collectPackIdsFromOrderLines(lines);
  if (packIds.length === 0) return packsById;

  const allItems = await listPublicPackItemsByPackIdsRepo(config, packIds);
  const itemsByPack = new Map<string, PublicPackItemRow[]>();
  for (const item of allItems) {
    const list = itemsByPack.get(item.pack_id) ?? [];
    list.push(item);
    itemsByPack.set(item.pack_id, list);
  }

  await Promise.all(
    packIds.map(async (packId) => {
      const pack = await getPublicPackByIdRepo(config, packId);
      if (!pack) return;

      const items = itemsByPack.get(packId) ?? [];
      packsById.set(packId, {
        id: pack.id,
        sku: pack.sku,
        name: pack.name,
        prices: pack.prices,
        campaign_id: pack.campaign_id,
        image_url: pack.image_url,
        is_active: pack.is_active,
        deleted_at: pack.deleted_at,
        items: items.map((item) => ({
          product_id: item.product_id,
          package_quantity: item.package_quantity,
          unit_quantity: item.unit_quantity ?? 0,
        })),
        purchase_min_quantity: pack.purchase_min_quantity ?? 1,
        purchase_max_quantity: pack.purchase_max_quantity ?? 100,
        available_quantity: computePackAvailableQuantity(items),
      });
    }),
  );

  return packsById;
}

function validateProductPurchaseQuantities(
  lines: {
    type: string;
    productId?: string;
    packageQuantity?: number;
    unitQuantity?: number;
  }[],
  catalogProducts: PublicProductRow[],
): boolean {
  const productsById = new Map(catalogProducts.map((row) => [row.id, row]));

  for (const line of lines) {
    if (
      line.type !== "product" ||
      !line.productId ||
      line.packageQuantity == null
    ) {
      continue;
    }

    if ((line.unitQuantity ?? 0) > 0) return false;

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
      line.packageQuantity < bounds.minQuantity ||
      line.packageQuantity > bounds.maxQuantity
    ) {
      return false;
    }
  }

  return true;
}

function validatePackPurchaseQuantities(
  lines: { type: string; packId?: string; quantity?: number }[],
  packsById: Map<
    string,
    {
      purchase_min_quantity: number;
      purchase_max_quantity: number;
      available_quantity: number;
    }
  >,
): boolean {
  for (const line of lines) {
    if (line.type !== "pack" || !line.packId || line.quantity == null) {
      continue;
    }

    const pack = packsById.get(line.packId);
    if (!pack) return false;

    const bounds = resolveProductPurchaseBounds({
      productType: "unit",
      itemsPerPackage: 1,
      stockTotalBaseUnits: pack.available_quantity,
      purchaseMinQuantity: pack.purchase_min_quantity,
      purchaseMaxQuantity: pack.purchase_max_quantity,
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
        productType: product.product_type ?? "unit",
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
        | "PACK_NOT_FOUND"
        | "DUPLICATE_PRODUCT_IN_BUNDLE"
        | "INVALID_PURCHASE_QUANTITY"
        | "INVALID_BUNDLE_CUSTOMIZATION";
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
    !validateProductPurchaseQuantities(parsed.data.lines, catalogProducts) ||
    !validatePackPurchaseQuantities(parsed.data.lines, packsById)
  ) {
    return { ok: false, error: "INVALID_PURCHASE_QUANTITY" };
  }

  const campaignIds = [
    ...new Set([
      ...products
        .map((product) => product.campaign_id)
        .filter((id): id is string => Boolean(id)),
      ...[...packsById.values()]
        .map((pack) => pack.campaign_id)
        .filter((id): id is string => Boolean(id)),
    ]),
  ];
  const campaigns = await listWizardCampaignsByIdsRepo(config, campaignIds);
  const { bundlesById, customizationBoundsById } = await resolveBundlesById(
    config,
    parsed.data.lines,
  );

  for (const line of parsed.data.lines) {
    if (line.type === "bundle" && !bundlesById.has(line.bundleId)) {
      return { ok: false, error: "BUNDLE_NOT_FOUND" };
    }
  }

  if (
    !validateOrderLinesBundleCustomization(
      parsed.data.lines,
      customizationBoundsById,
    )
  ) {
    return { ok: false, error: "INVALID_BUNDLE_CUSTOMIZATION" };
  }

  const cartResult = buildOrderCartWithTotals({
    lines: parsed.data.lines,
    products,
    campaigns,
    bundlesById,
    packsById,
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
    if (cartResult.error === "PACK_NOT_FOUND") {
      return { ok: false, error: "PACK_NOT_FOUND" };
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
        | "PACK_NOT_FOUND"
        | "DUPLICATE_PRODUCT_IN_BUNDLE"
        | "OUT_OF_COVERAGE"
        | "PICKUP_POINT_NOT_FOUND"
        | "PICKUP_POINT_INACTIVE"
        | "PICKUP_POINT_REQUIRED"
        | "SHIPPING_FEE_MISMATCH"
        | "INSUFFICIENT_STOCK"
        | "INVALID_PURCHASE_QUANTITY"
        | "INVALID_BUNDLE_CUSTOMIZATION";
    }
> {
  const scope = "createGuestOrderService";
  const parsed = createGuestOrderInputSchema.safeParse(raw);
  if (!parsed.success) {
    logServerError(scope, {
      message: "VALIDATION",
      issueCount: parsed.error.issues.length,
    });
    return { ok: false, error: "VALIDATION" };
  }

  logServerInfo(scope, "start", {
    lineCount: parsed.data.lines.length,
    method: parsed.data.fulfillment.method,
    hasDistrict: Boolean(parsed.data.fulfillment.deliveryAddress?.district),
    hasMapPin: Boolean(parsed.data.mapPin),
    pickupPointId: parsed.data.fulfillment.pickupPoint?.id,
  });

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
  const [products, catalogProducts] = await Promise.all([
    getWizardProductsByIdsRepo(config, productIds),
    getPublicProductsByIdsRepo(config, productIds),
  ]);
  if (products.length !== productIds.length) {
    logServerError(scope, {
      message: "PRODUCT_NOT_FOUND",
      requested: productIds.length,
      found: products.length,
    });
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  if (products.some((product) => !product.is_active)) {
    logServerError(scope, {
      message: "PRODUCT_NOT_FOUND",
      reason: "inactive_product",
      inactiveCount: products.filter((product) => !product.is_active).length,
    });
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  if (
    catalogProducts.length !== productIds.length ||
    !validateProductPurchaseQuantities(parsed.data.lines, catalogProducts) ||
    !validatePackPurchaseQuantities(parsed.data.lines, packsById)
  ) {
    logServerError(scope, {
      message: "INVALID_PURCHASE_QUANTITY",
      catalogFound: catalogProducts.length,
      requested: productIds.length,
    });
    return { ok: false, error: "INVALID_PURCHASE_QUANTITY" };
  }

  const campaignIds = [
    ...new Set([
      ...products
        .map((product) => product.campaign_id)
        .filter((id): id is string => Boolean(id)),
      ...[...packsById.values()]
        .map((pack) => pack.campaign_id)
        .filter((id): id is string => Boolean(id)),
    ]),
  ];
  const campaigns = await listWizardCampaignsByIdsRepo(config, campaignIds);
  const { bundlesById, customizationBoundsById } = await resolveBundlesById(
    config,
    parsed.data.lines,
  );

  for (const line of parsed.data.lines) {
    if (line.type === "bundle" && !bundlesById.has(line.bundleId)) {
      return { ok: false, error: "BUNDLE_NOT_FOUND" };
    }
  }

  if (
    !validateOrderLinesBundleCustomization(
      parsed.data.lines,
      customizationBoundsById,
    )
  ) {
    logServerError(scope, {
      message: "INVALID_BUNDLE_CUSTOMIZATION",
    });
    return { ok: false, error: "INVALID_BUNDLE_CUSTOMIZATION" };
  }

  const [zones, settings, points] = await Promise.all([
    listActiveDeliveryZonesRepo(config),
    getDeliverySettingsRepo(config),
    listActivePickupPointsRepo(config),
  ]);

  let fulfillmentToPersist = parsed.data.fulfillment;

  if (parsed.data.fulfillment.method === "pickup_point") {
    const pickupPointId = parsed.data.fulfillment.pickupPoint?.id;
    if (!pickupPointId) {
      logServerError(scope, { message: "PICKUP_POINT_REQUIRED" });
      return { ok: false, error: "PICKUP_POINT_REQUIRED" };
    }

    const pointRow =
      points.find((point) => point.id === pickupPointId) ??
      (await getPickupPointByIdRepo(config, pickupPointId));

    if (!pointRow) {
      logServerError(scope, {
        message: "PICKUP_POINT_NOT_FOUND",
        pickupPointId,
      });
      return { ok: false, error: "PICKUP_POINT_NOT_FOUND" };
    }

    if (!pointRow.is_active) {
      logServerError(scope, {
        message: "PICKUP_POINT_INACTIVE",
        pickupPointId,
      });
      return { ok: false, error: "PICKUP_POINT_INACTIVE" };
    }

    fulfillmentToPersist = {
      method: "pickup_point",
      pickupPoint: {
        id: pointRow.id,
        name: pointRow.name,
        lat: Number(pointRow.lat),
        lng: Number(pointRow.lng),
        fee: Number(pointRow.fee),
      },
      notes: parsed.data.fulfillment.notes ?? null,
    };
  }

  const deliveryResult = resolveCheckoutFulfillmentFee(
    fulfillmentToPersist.method,
    fulfillmentToPersist.deliveryAddress?.district,
    parsed.data.mapPin,
    zones.map((zone) => ({
      district: zone.district,
      fee: Number(zone.fee),
      isActive: zone.is_active,
    })),
    {
      pickupEnabled: settings?.pickup_enabled ?? storeFeatures.pickupEnabled,
      pickupPointsEnabled: settings?.pickup_points_enabled ?? true,
      deliveryEnabled: settings?.delivery_enabled ?? true,
      fallbackFee: Number(settings?.fallback_fee ?? 0),
    },
    fulfillmentToPersist.pickupPoint?.id,
    points.map((point) => ({
      id: point.id,
      fee: Number(point.fee),
      isActive: point.is_active,
    })),
  );

  if (!deliveryResult.covered) {
    logServerError(scope, {
      message: "OUT_OF_COVERAGE",
      method: fulfillmentToPersist.method,
      hasDistrict: Boolean(fulfillmentToPersist.deliveryAddress?.district),
      hasMapPin: Boolean(parsed.data.mapPin),
      pickupPointId: fulfillmentToPersist.pickupPoint?.id,
    });
    return { ok: false, error: "OUT_OF_COVERAGE" };
  }

  if (parsed.data.shippingTotal !== deliveryResult.fee) {
    logServerError(scope, {
      message: "SHIPPING_FEE_MISMATCH",
      clientFee: parsed.data.shippingTotal,
      serverFee: deliveryResult.fee,
    });
    return { ok: false, error: "SHIPPING_FEE_MISMATCH" };
  }

  const cartResult = buildOrderCartWithTotals({
    lines: parsed.data.lines,
    products,
    campaigns,
    bundlesById,
    packsById,
    discountTotal: parsed.data.discountTotal,
    shippingTotal: deliveryResult.fee,
  });

  if (!cartResult.ok) {
    logServerError(scope, {
      message: cartResult.error,
      lineTypes: parsed.data.lines.map((line) => line.type),
    });
    if (cartResult.error === "DUPLICATE_PRODUCT_IN_BUNDLE") {
      return { ok: false, error: "DUPLICATE_PRODUCT_IN_BUNDLE" };
    }
    if (cartResult.error === "PACK_NOT_FOUND") {
      return { ok: false, error: "PACK_NOT_FOUND" };
    }
    if (cartResult.error === "PRODUCT_NOT_FOUND") {
      return { ok: false, error: "PRODUCT_NOT_FOUND" };
    }
    return { ok: false, error: "BUNDLE_NOT_FOUND" };
  }

  const stockCheck = await checkCartStockService(config, {
    lines: cartResult.shoppingCart.lines,
  });
  if (!stockCheck.ok) {
    logServerError(scope, {
      message: "STOCK_CHECK_VALIDATION",
      error: stockCheck.error,
    });
    return { ok: false, error: "VALIDATION" };
  }
  if (!stockCheck.data.ok) {
    logServerError(scope, {
      message: "INSUFFICIENT_STOCK",
      shortageCount: stockCheck.data.shortages.length,
    });
    return { ok: false, error: "INSUFFICIENT_STOCK" };
  }

  const { shoppingCart, totals } = cartResult;
  const inserted = await insertGuestOrderRepo(config, {
    contact: asJson(parsed.data.contact),
    fulfillment: asJson(fulfillmentToPersist),
    shoppingCart: asJson(shoppingCart),
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    shippingTotal: totals.shippingTotal,
    total: totals.total,
    pricingSnapshot: asJson(totals),
    metadata: asJson(
      fulfillmentToPersist.method === "delivery" && parsed.data.mapPin
        ? { mapPin: parsed.data.mapPin }
        : {},
    ),
  });

  logServerInfo(scope, "created", {
    orderId: inserted.id,
    orderNumber: inserted.orderNumber,
    total: totals.total,
  });

  const settingsResult = await getPublicBusinessSettingsService(config);
  const adminEmail =
    settingsResult.ok && settingsResult.data.email
      ? settingsResult.data.email
      : "";

  await scheduleOrderCreatedNotification({
    source: "ecommerce",
    orderId: inserted.id,
    orderNumber: inserted.orderNumber,
    total: totals.total,
    currencyCode: "PEN",
    subtotal: totals.subtotal,
    shippingTotal: totals.shippingTotal,
    discountTotal: totals.discountTotal,
    statusLabel: "Pendiente de pago",
    contact: {
      name: parsed.data.contact.name,
      lastName: parsed.data.contact.lastName,
      email: parsed.data.contact.email,
      phone: parsed.data.contact.phone,
    },
    lines: mapCartLinesToNotifyLines(shoppingCart.lines),
    fulfillment: mapFulfillmentToNotify({
      method: fulfillmentToPersist.method,
      deliveryAddress: fulfillmentToPersist.deliveryAddress,
      pickupPoint: fulfillmentToPersist.pickupPoint,
    }),
    adminEmail,
  });

  return {
    ok: true,
    data: { id: inserted.id, orderNumber: inserted.orderNumber },
  };
}

function snapshotLinesToOrderInput(
  lines: ValidateGuestCheckoutCartInput["lines"],
) {
  return lines.map((line) => {
    if (line.type === "product") {
      return {
        type: "product" as const,
        productId: line.productId,
        packageQuantity: line.packageQuantity,
        unitQuantity: 0,
      };
    }
    if (line.type === "pack") {
      return {
        type: "pack" as const,
        packId: line.packId,
        quantity: line.quantity,
      };
    }
    return {
      type: "bundle" as const,
      bundleId: line.bundleId,
      quantity: line.quantity,
      components: line.components.map((component) => ({
        productId: component.productId,
        quantityPerUnit: component.quantityPerUnit,
      })),
    };
  });
}

function detectSnapshotPriceDrift(
  snapshot: ValidateGuestCheckoutCartInput["lines"],
  serverLines: OrderShoppingCartLine[],
): boolean {
  if (snapshot.length !== serverLines.length) return true;

  for (let index = 0; index < snapshot.length; index += 1) {
    const local = snapshot[index];
    const server = serverLines[index];
    if (!local || !server || local.type !== server.type) return true;

    if (local.type === "product" && server.type === "product") {
      if (
        local.packagePrice !== server.packagePrice ||
        local.unitPrice !== server.unitPrice ||
        local.packageQuantity !== server.packageQuantity ||
        local.unitQuantity !== server.unitQuantity ||
        local.lineTotal !== server.lineTotal
      ) {
        return true;
      }
      continue;
    }

    if (local.type === "pack" && server.type === "pack") {
      if (
        local.unitPrice !== server.unitPrice ||
        local.lineTotal !== server.lineTotal
      ) {
        return true;
      }
      continue;
    }

    if (local.type === "bundle" && server.type === "bundle") {
      if (local.lineTotal !== server.lineTotal) return true;
    }
  }

  return false;
}

export async function validateGuestCheckoutCartService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | {
      ok: true;
      data: {
        ok: boolean;
        priceChanged: boolean;
        stockOk: boolean;
        lines: OrderShoppingCartLine[];
        stock: ReturnType<typeof checkOrderStock>;
      };
    }
  | {
      ok: false;
      error:
        | "VALIDATION"
        | "PRODUCT_NOT_FOUND"
        | "BUNDLE_NOT_FOUND"
        | "PACK_NOT_FOUND"
        | "DUPLICATE_PRODUCT_IN_BUNDLE"
        | "INVALID_PURCHASE_QUANTITY"
        | "INVALID_BUNDLE_CUSTOMIZATION";
    }
> {
  const parsed = validateGuestCheckoutCartInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  if (parsed.data.lines.length === 0) {
    return {
      ok: true,
      data: {
        ok: true,
        priceChanged: false,
        stockOk: true,
        lines: [],
        stock: { ok: true },
      },
    };
  }

  const preview = await previewGuestOrderCartService(config, {
    lines: snapshotLinesToOrderInput(parsed.data.lines),
    shippingTotal: 0,
    discountTotal: 0,
  });

  if (!preview.ok) {
    return { ok: false, error: preview.error };
  }

  const priceChanged = detectSnapshotPriceDrift(
    parsed.data.lines,
    preview.data.lines,
  );

  const stockResult = await checkCartStockService(config, {
    lines: preview.data.lines,
  });
  if (!stockResult.ok) {
    return { ok: false, error: "VALIDATION" };
  }

  const stockOk = stockResult.data.ok;
  const valid = !priceChanged && stockOk;

  return {
    ok: true,
    data: {
      ok: valid,
      priceChanged,
      stockOk,
      lines: preview.data.lines,
      stock: stockResult.data,
    },
  };
}
