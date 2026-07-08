import "server-only";

import { storeFeatures } from "@de-tin-marin/config/store-features";
import { buildOrderCartWithTotals } from "@de-tin-marin/shared/build-order-cart";
import {
  aggregateStockDemands,
  checkOrderStock,
} from "@de-tin-marin/shared/check-order-stock";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  customizeBundleInputSchema,
  getBundleForWizardInputSchema,
  type BundleLinePreview,
  type BundleWizardTemplate,
} from "@de-tin-marin/validations/customize-bundle";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import {
  getPublicBundleByIdRepo,
  listPublicBundleItemsByBundleIdsRepo,
  type PublicBundleItemRow,
} from "@/modules/catalog/repositories/bundle.repository";
import {
  getActiveContainersByIdsRepo,
  getContainerNetPrice,
} from "@/modules/catalog/repositories/surprise-container.repository";
import {
  getWizardProductsByIdsRepo,
  listWizardCampaignsByIdsRepo,
} from "../repositories/wizard-product.repository";
import {
  getWizardContainerStockByIdsRepo,
  getWizardProductStockByIdsRepo,
} from "../repositories/wizard-stock.repository";
import { clampBundleInitialComponents } from "../helpers/clamp-initial-components";

function normalizeImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || imageUrl.trim() === "") {
    return CATALOG_PLACEHOLDER_IMAGE;
  }
  return imageUrl;
}

function isActiveBundleItem(item: PublicBundleItemRow): boolean {
  const product = item.products;
  return Boolean(product?.is_active && product.deleted_at === null);
}

function toInitialComponents(items: PublicBundleItemRow[]) {
  return clampBundleInitialComponents(
    items.filter(isActiveBundleItem).map((item) => ({
      productId: item.product_id,
      quantityPerUnit: storeFeatures.enableUnitsPerPerson
        ? item.units_per_person
        : 1,
    })),
  );
}

export async function getBundleForWizardService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: BundleWizardTemplate }
  | { ok: false; error: "VALIDATION" | "NOT_FOUND" }
> {
  const parsed = getBundleForWizardInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const row = await getPublicBundleByIdRepo(config, parsed.data.bundleId);
  if (!row) return { ok: false, error: "NOT_FOUND" };

  const containers = await getActiveContainersByIdsRepo(config, [
    row.container_id,
  ]);
  const containerRow = containers[0];
  if (!containerRow) return { ok: false, error: "NOT_FOUND" };

  const { name, netPrice } = getContainerNetPrice(containerRow);
  const items = await listPublicBundleItemsByBundleIdsRepo(config, [row.id]);
  const activeItems = items.filter(isActiveBundleItem);

  return {
    ok: true,
    data: {
      bundleId: row.id,
      name: row.name,
      imageUrl: normalizeImageUrl(row.image_url),
      personCount: row.quantity,
      container: {
        containerId: containerRow.id,
        sku: containerRow.sku,
        name,
        unitPrice: netPrice,
      },
      items: activeItems.map((item) => ({
        productId: item.product_id,
        productName: item.products?.name ?? "—",
        unitsPerPerson: item.units_per_person,
      })),
      initialComponents: toInitialComponents(items),
    },
  };
}

export async function previewBundleLineService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: BundleLinePreview }
  | {
      ok: false;
      error:
        | "VALIDATION"
        | "NOT_FOUND"
        | "PRODUCT_NOT_FOUND"
        | "INACTIVE_PRODUCT"
        | "DUPLICATE_PRODUCT";
    }
> {
  const parsed = customizeBundleInputSchema.safeParse(raw);
  if (!parsed.success) {
    const hasDuplicate = parsed.error.issues.some(
      (issue) => issue.message === "DUPLICATE_PRODUCT",
    );
    if (hasDuplicate) {
      return { ok: false, error: "DUPLICATE_PRODUCT" };
    }
    return { ok: false, error: "VALIDATION" };
  }

  const { bundleId, components } = parsed.data;
  const bundleRow = await getPublicBundleByIdRepo(config, bundleId);
  if (!bundleRow) return { ok: false, error: "NOT_FOUND" };

  const containers = await getActiveContainersByIdsRepo(config, [
    bundleRow.container_id,
  ]);
  const containerRow = containers[0];
  if (!containerRow) return { ok: false, error: "NOT_FOUND" };

  const productIds = components.map((component) => component.productId);
  const products = await getWizardProductsByIdsRepo(config, productIds);

  if (products.length !== productIds.length) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  if (products.some((product) => !product.is_active)) {
    return { ok: false, error: "INACTIVE_PRODUCT" };
  }

  const campaignIds = [
    ...new Set(
      products
        .map((product) => product.campaign_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const campaigns = await listWizardCampaignsByIdsRepo(config, campaignIds);
  const { name: containerName } = getContainerNetPrice(containerRow);

  const cartResult = buildOrderCartWithTotals({
    lines: [
      {
        type: "bundle",
        bundleId,
        quantity: bundleRow.quantity,
        components,
      },
    ],
    products,
    campaigns,
    bundlesById: new Map([
      [
        bundleId,
        {
          id: bundleRow.id,
          name: bundleRow.name,
          is_active: bundleRow.is_active,
          deleted_at: bundleRow.deleted_at,
          container: {
            id: containerRow.id,
            sku: containerRow.sku,
            name: containerName,
            prices: containerRow.prices,
          },
        },
      ],
    ]),
  });

  if (!cartResult.ok) {
    if (cartResult.error === "DUPLICATE_PRODUCT_IN_BUNDLE") {
      return { ok: false, error: "DUPLICATE_PRODUCT" };
    }
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  const bundleLine = cartResult.shoppingCart.lines[0];
  if (!bundleLine || bundleLine.type !== "bundle") {
    return { ok: false, error: "NOT_FOUND" };
  }

  const { products: productDemands, containers: containerDemands } =
    aggregateStockDemands(cartResult.shoppingCart);

  const [productStockRows, containerStockRows] = await Promise.all([
    getWizardProductStockByIdsRepo(config, [...productDemands.keys()]),
    getWizardContainerStockByIdsRepo(config, [...containerDemands.keys()]),
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

  const stockCheck = checkOrderStock(
    cartResult.shoppingCart,
    productsById,
    containersById,
  );

  return {
    ok: true,
    data: {
      lineTotal: bundleLine.lineTotal,
      line: {
        ...bundleLine,
        imageUrl: normalizeImageUrl(bundleRow.image_url),
      },
      stockCheck,
    },
  };
}
