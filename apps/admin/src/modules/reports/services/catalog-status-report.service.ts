import "server-only";

import { computeBundleTotal } from "@de-tin-marin/shared/bundle-price";
import {
  computeFinalPrice,
  isCampaignActive,
  toCampaignForPricing,
} from "@de-tin-marin/shared/final-price";
import {
  computePackAvailableQuantity,
  packComponentPresentations,
  type PackAvailabilityProduct,
} from "@de-tin-marin/shared/pack-availability";
import {
  parsePackPricesJson,
  parseProductPricesJson,
  roundMoney,
} from "@de-tin-marin/shared/prices";
import { resolveStockInPresentations } from "@de-tin-marin/shared/product-purchase-limits";
import { computeProductMargin } from "@de-tin-marin/shared/product-margin";
import {
  computeTotalBaseUnits,
  formatStockDisplay,
} from "@de-tin-marin/shared/product-stock";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  listBundleItemsByBundleIdsRepo,
  listBundlesRepo,
  type BundleItemWithProduct,
} from "@/modules/catalog/repositories/bundle.repository";
import {
  listPackItemsByPackIdsRepo,
  listPacksRepo,
  type PackItemWithProduct,
} from "@/modules/catalog/repositories/pack.repository";
import {
  listCampaignsByIdsRepo,
  listProductsRepo,
  parsePricesJson,
  type CampaignPricingRow,
} from "@/modules/catalog/repositories/product.repository";
import {
  getContainersByIdsRepo,
  listSurpriseContainersRepo,
  parseContainerPricesJson,
} from "@/modules/catalog/repositories/surprise-container.repository";
import { listOrdersRepo } from "@/modules/orders/repositories/order.repository";
import type { CatalogStatusSection } from "../schemas/export-catalog-status.schema";
import type {
  CatalogStatusBundleCompositionRow,
  CatalogStatusBundleRow,
  CatalogStatusContainerRow,
  CatalogStatusOrderCartBlock,
  CatalogStatusOrderListRow,
  CatalogStatusPackCompositionRow,
  CatalogStatusPackRow,
  CatalogStatusProductRow,
  CatalogStatusReportData,
} from "../types/catalog-status-report.dto";
import {
  buildCatalogStatusWorkbook,
  catalogStatusFilename,
} from "../helpers/build-catalog-status-workbook";
import { flattenOrderCartLines } from "../helpers/flatten-order-cart-lines";
import { orderCartAnchorName } from "../helpers/order-cart-anchor";
function toAvailabilityProduct(
  product: NonNullable<PackItemWithProduct["products"]>,
): PackAvailabilityProduct {
  return {
    isActive: product.is_active,
    deletedAt: product.deleted_at,
    productType: (product.product_type as "unit" | "package") ?? "unit",
    itemsPerPackage: product.items_per_package ?? 1,
    stockSealedPackages: product.stock_sealed_packages,
    stockLooseBaseUnits: product.stock_loose_base_units,
  };
}

function stockDisplayForProduct(
  product: NonNullable<
    BundleItemWithProduct["products"] | PackItemWithProduct["products"]
  >,
): string {
  return formatStockDisplay({
    sealedPackages: product.stock_sealed_packages,
    looseBaseUnits: product.stock_loose_base_units,
    itemsPerPackage: product.items_per_package ?? 1,
    packageLabel: product.package_label,
  });
}

async function loadProducts(
  config: SupabaseConfig,
): Promise<CatalogStatusProductRow[]> {
  const rows = await listProductsRepo(config);
  const campaignIds = [
    ...new Set(
      rows
        .map((row) => row.campaign_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const campaigns = await listCampaignsByIdsRepo(config, campaignIds);
  const campaignsById = new Map(campaigns.map((c) => [c.id, c]));

  return rows.map((row) => {
    const campaign: CampaignPricingRow | null = row.campaign_id
      ? (campaignsById.get(row.campaign_id) ?? null)
      : null;
    const { packageNetPrice, unitNetPrice } = parsePricesJson(row.prices);
    const itemsPerPackage = row.items_per_package;
    const productType = row.product_type as "unit" | "package";
    const campaignForPricing = campaign ? toCampaignForPricing(campaign) : null;
    const finalPrice = computeFinalPrice(packageNetPrice, campaignForPricing);
    const finalUnitPrice =
      campaignForPricing && isCampaignActive(campaignForPricing)
        ? roundMoney(finalPrice / itemsPerPackage)
        : unitNetPrice;
    const stockTotalBaseUnits =
      productType === "unit"
        ? row.stock_loose_base_units
        : computeTotalBaseUnits(
            row.stock_sealed_packages,
            row.stock_loose_base_units,
            itemsPerPackage,
          );
    const stockInPresentations = resolveStockInPresentations({
      productType,
      itemsPerPackage,
      stockTotalBaseUnits,
    });
    const activeCampaign =
      campaign && campaignForPricing && isCampaignActive(campaignForPricing)
        ? campaign
        : null;
    const costNetPrice =
      row.cost_net_price === null || row.cost_net_price === undefined
        ? null
        : Number(row.cost_net_price);
    const { margin, marginPct } = computeProductMargin({
      saleNetPrice: packageNetPrice,
      costNetPrice,
    });

    return {
      sku: row.sku,
      name: row.name,
      description: row.description,
      slug: row.slug,
      brand: row.brand,
      categoryName: row.categories?.name ?? "—",
      productType,
      itemsPerPackage,
      packageLabel: row.package_label,
      netPrice: packageNetPrice,
      unitNetPrice,
      finalPrice,
      finalUnitPrice,
      campaignName: activeCampaign?.name ?? null,
      campaignPercentage: activeCampaign
        ? Number(activeCampaign.percentage)
        : null,
      costNetPrice,
      margin,
      marginPct,
      stockSealedPackages: row.stock_sealed_packages,
      stockLooseBaseUnits: row.stock_loose_base_units,
      stockTotalBaseUnits,
      stockDisplay: formatStockDisplay({
        sealedPackages: row.stock_sealed_packages,
        looseBaseUnits: row.stock_loose_base_units,
        itemsPerPackage,
        packageLabel: row.package_label,
      }),
      stockInPresentations,
      purchaseMinQuantity: row.purchase_min_quantity ?? 10,
      purchaseMaxQuantity: row.purchase_max_quantity ?? 100,
      isActive: row.is_active,
      imageUrl: row.image_url,
    };
  });
}

async function loadBundles(config: SupabaseConfig): Promise<{
  bundles: CatalogStatusBundleRow[];
  composition: CatalogStatusBundleCompositionRow[];
}> {
  const rows = await listBundlesRepo(config);
  if (rows.length === 0) {
    return { bundles: [], composition: [] };
  }

  const items = await listBundleItemsByBundleIdsRepo(
    config,
    rows.map((row) => row.id),
  );
  const itemsByBundle = new Map<string, BundleItemWithProduct[]>();
  for (const item of items) {
    const list = itemsByBundle.get(item.bundle_id) ?? [];
    list.push(item);
    itemsByBundle.set(item.bundle_id, list);
  }

  const containerIds = [...new Set(rows.map((row) => row.container_id))];
  const containers = await getContainersByIdsRepo(config, containerIds);
  const containersById = new Map(
    containers.map((container) => [
      container.id,
      {
        sku: container.sku,
        name: container.name,
        netPrice: parseContainerPricesJson(container.prices).netPrice,
        stock: container.stock_quantity,
      },
    ]),
  );

  const bundles: CatalogStatusBundleRow[] = [];
  const composition: CatalogStatusBundleCompositionRow[] = [];

  for (const row of rows) {
    const bundleItems = itemsByBundle.get(row.id) ?? [];
    const container = containersById.get(row.container_id);
    const containerNetPrice = container?.netPrice ?? 0;
    const priceItems = bundleItems.map((item) => ({
      unitNetPrice: parsePricesJson(item.products?.prices ?? {}).unitNetPrice,
      unitsPerPerson: item.units_per_person,
    }));
    const { itemsSubtotal, containerSubtotal, total } = computeBundleTotal({
      containerNetPrice,
      quantity: row.quantity,
      items: priceItems,
    });

    bundles.push({
      name: row.name,
      description: row.description,
      isActive: row.is_active,
      quantity: row.quantity,
      containerSku: container?.sku ?? "—",
      containerName: container?.name ?? "—",
      containerNetPrice,
      containerStock: container?.stock ?? 0,
      itemCount: bundleItems.length,
      itemsSubtotal,
      containerSubtotal,
      total,
      imageUrl: row.image_url,
    });

    for (const item of bundleItems) {
      const product = item.products;
      composition.push({
        bundleName: row.name,
        productSku: product?.sku ?? "—",
        productName: product?.name ?? "—",
        unitsPerPerson: item.units_per_person,
        unitNetPrice: parsePricesJson(product?.prices ?? {}).unitNetPrice,
        productIsActive: Boolean(product?.is_active && !product.deleted_at),
        productStockDisplay: product ? stockDisplayForProduct(product) : "—",
      });
    }
  }

  return { bundles, composition };
}

async function loadPacks(config: SupabaseConfig): Promise<{
  packs: CatalogStatusPackRow[];
  composition: CatalogStatusPackCompositionRow[];
}> {
  const rows = await listPacksRepo(config);
  if (rows.length === 0) {
    return { packs: [], composition: [] };
  }

  const items = await listPackItemsByPackIdsRepo(
    config,
    rows.map((row) => row.id),
  );
  const itemsByPack = new Map<string, PackItemWithProduct[]>();
  for (const item of items) {
    const list = itemsByPack.get(item.pack_id) ?? [];
    list.push(item);
    itemsByPack.set(item.pack_id, list);
  }

  const campaignIds = [
    ...new Set(
      rows
        .map((row) => row.campaign_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const campaigns = await listCampaignsByIdsRepo(config, campaignIds);
  const campaignsById = new Map(campaigns.map((c) => [c.id, c]));

  const packs: CatalogStatusPackRow[] = [];
  const composition: CatalogStatusPackCompositionRow[] = [];

  for (const row of rows) {
    const packItems = itemsByPack.get(row.id) ?? [];
    const { normalNetPrice, referenceNetPrice } = parsePackPricesJson(
      row.prices,
    );
    const campaign = row.campaign_id
      ? (campaignsById.get(row.campaign_id) ?? null)
      : null;
    const campaignForPricing = campaign ? toCampaignForPricing(campaign) : null;
    const finalPrice = computeFinalPrice(normalNetPrice, campaignForPricing);
    const activeCampaign =
      campaign && campaignForPricing && isCampaignActive(campaignForPricing)
        ? campaign
        : null;

    const availableQuantity = computePackAvailableQuantity(
      packItems.map((item) => ({
        packageQuantity: item.package_quantity,
        unitQuantity: item.unit_quantity ?? 0,
        product: item.products ? toAvailabilityProduct(item.products) : null,
      })),
    );

    packs.push({
      sku: row.sku,
      name: row.name,
      description: row.description,
      slug: row.slug,
      referencePrice: referenceNetPrice,
      normalPrice: normalNetPrice,
      finalPrice,
      campaignName: activeCampaign?.name ?? null,
      campaignPercentage: activeCampaign
        ? Number(activeCampaign.percentage)
        : null,
      itemCount: packItems.length,
      availableQuantity,
      purchaseMinQuantity: row.purchase_min_quantity,
      purchaseMaxQuantity: row.purchase_max_quantity,
      isActive: row.is_active,
      imageUrl: row.image_url,
    });

    for (const item of packItems) {
      const product = item.products;
      const availabilityProduct = product
        ? toAvailabilityProduct(product)
        : null;
      composition.push({
        packSku: row.sku,
        packName: row.name,
        productSku: product?.sku ?? "—",
        productName: product?.name ?? "—",
        packageQuantity: item.package_quantity,
        unitQuantity: item.unit_quantity ?? 0,
        packageNetPrice: parseProductPricesJson(product?.prices ?? {})
          .packageNetPrice,
        unitNetPrice: parseProductPricesJson(product?.prices ?? {})
          .unitNetPrice,
        productPresentations: availabilityProduct
          ? packComponentPresentations(availabilityProduct)
          : 0,
        productIsActive: Boolean(product?.is_active && !product.deleted_at),
      });
    }
  }

  return { packs, composition };
}

async function loadContainers(
  config: SupabaseConfig,
): Promise<CatalogStatusContainerRow[]> {
  const rows = await listSurpriseContainersRepo(config);
  return rows.map((row) => ({
    sku: row.sku,
    name: row.name,
    description: row.description,
    netPrice: parseContainerPricesJson(row.prices).netPrice,
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
    imageUrl: row.image_url,
  }));
}

async function loadOrders(config: SupabaseConfig): Promise<{
  orders: CatalogStatusOrderListRow[];
  orderCarts: CatalogStatusOrderCartBlock[];
}> {
  const rows = await listOrdersRepo(config);
  const orders: CatalogStatusOrderListRow[] = [];
  const orderCarts: CatalogStatusOrderCartBlock[] = [];

  for (const row of rows) {
    const contact = (row.contact ?? {}) as Record<string, string>;
    const fulfillment = (row.fulfillment ?? {}) as { method?: string };
    const cartLines = flattenOrderCartLines(row.shopping_cart);
    const cartAnchor = orderCartAnchorName(row.order_number);
    const customerName =
      `${contact.name ?? ""} ${contact.lastName ?? ""}`.trim() || "—";

    orders.push({
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
      paymentStatus: row.payment_status,
      customerName,
      customerEmail: contact.email ?? null,
      customerPhone: contact.phone ?? null,
      fulfillmentMethod: fulfillment.method ?? null,
      subtotal: Number(row.subtotal),
      discountTotal: Number(row.discount_total),
      surchargeTotal: Number(row.surcharge_total ?? 0),
      shippingTotal: Number(row.shipping_total),
      total: Number(row.total),
      lineCount: cartLines.filter((line) => line.level === "line").length,
      currencyCode: row.currency_code,
      createdAt: row.created_at,
      cartAnchor,
    });

    orderCarts.push({
      orderNumber: row.order_number,
      cartAnchor,
      status: row.status,
      paymentStatus: row.payment_status,
      customerName,
      total: Number(row.total),
      lines: cartLines,
    });
  }

  return { orders, orderCarts };
}

export async function buildCatalogStatusReportData(
  config: SupabaseConfig,
  sections: CatalogStatusSection[],
): Promise<CatalogStatusReportData> {
  const uniqueSections = [...new Set(sections)];
  const generatedAt = new Date().toISOString();

  const [products, bundlesResult, packsResult, containers, ordersResult] =
    await Promise.all([
      uniqueSections.includes("products")
        ? loadProducts(config)
        : Promise.resolve([]),
      uniqueSections.includes("bundles")
        ? loadBundles(config)
        : Promise.resolve({ bundles: [], composition: [] }),
      uniqueSections.includes("packs")
        ? loadPacks(config)
        : Promise.resolve({ packs: [], composition: [] }),
      uniqueSections.includes("containers")
        ? loadContainers(config)
        : Promise.resolve([]),
      uniqueSections.includes("orders")
        ? loadOrders(config)
        : Promise.resolve({ orders: [], orderCarts: [] }),
    ]);

  return {
    meta: {
      generatedAt,
      sections: uniqueSections,
      timezone: "UTC",
    },
    products,
    bundles: bundlesResult.bundles,
    bundleComposition: bundlesResult.composition,
    packs: packsResult.packs,
    packComposition: packsResult.composition,
    containers,
    orders: ordersResult.orders,
    orderCarts: ordersResult.orderCarts,
  };
}
export async function exportCatalogStatusReportService(
  config: SupabaseConfig,
  sections: CatalogStatusSection[],
): Promise<{ filename: string; base64: string }> {
  const data = await buildCatalogStatusReportData(config, sections);
  const buffer = await buildCatalogStatusWorkbook(data);
  const base64 = Buffer.from(buffer).toString("base64");
  return {
    filename: catalogStatusFilename(data.meta.generatedAt),
    base64,
  };
}
