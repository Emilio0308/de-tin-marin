import "server-only";

import { z } from "zod";
import { computeBundleTotal } from "@de-tin-marin/shared/bundle-price";
import {
  computeFinalPrice,
  toCampaignForPricing,
} from "@de-tin-marin/shared/final-price";
import {
  parsePackPricesJson,
  parseProductPricesJson,
} from "@de-tin-marin/shared/prices";
import {
  computePackAvailableQuantity as computePackAvailableQuantityShared,
  isActivePackAvailabilityComponent,
  type PackAvailabilityComponent,
} from "@de-tin-marin/shared/pack-availability";
import {
  computeTotalBaseUnits,
  formatStockDisplay,
} from "@de-tin-marin/shared/product-stock";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  getPublicBundleInputSchema,
  getPublicPackInputSchema,
  getPublicProductInputSchema,
  publicBundleListQuerySchema,
  publicPackListQuerySchema,
  publicProductListQuerySchema,
  type PublicBundleDetail,
  type PublicBundleListItem,
  type PublicCategoryItem,
  type PublicPackDetail,
  type PublicPackListItem,
  type PublicProductDetail,
  type PublicProductListItem,
} from "@de-tin-marin/validations/public-catalog";
import { listWizardCampaignsByIdsRepo } from "@/modules/bundle-wizard/repositories/wizard-product.repository";
import { CATALOG_PLACEHOLDER_IMAGE } from "../constants";
import {
  getPublicBundleByIdRepo,
  listPublicBundleItemsByBundleIdsRepo,
  listPublicBundlesRepo,
  type PublicBundleItemRow,
  type PublicBundleRow,
} from "../repositories/bundle.repository";
import { listPublicCategoriesRepo } from "../repositories/category.repository";
import {
  getPublicPackByIdRepo,
  getPublicPackBySlugRepo,
  getPublicPacksByIdsRepo,
  listPublicPackItemsByPackIdsRepo,
  listPublicPacksRepo,
  type PublicPackItemRow,
  type PublicPackRow,
} from "../repositories/pack.repository";
import {
  getPublicProductByIdRepo,
  getPublicProductBySlugRepo,
  getPublicProductsByIdsRepo,
  listPublicProductsRepo,
  type PublicProductRow,
} from "../repositories/product.repository";
import {
  getActiveContainersByIdsRepo,
  getContainerNetPrice,
} from "../repositories/surprise-container.repository";

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

function toProductListItem(row: PublicProductRow): PublicProductListItem {
  const { packageNetPrice } = parseProductPricesJson(row.prices);
  const itemsPerPackage = row.items_per_package ?? 1;
  const finalPrice = computeFinalPrice(packageNetPrice, null);
  const stockTotalBaseUnits = computeTotalBaseUnits(
    row.stock_sealed_packages,
    row.stock_loose_base_units,
    itemsPerPackage,
  );

  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? "—",
    imageUrl: normalizeImageUrl(row.image_url),
    finalPrice,
    stockTotalBaseUnits,
    stockDisplay: formatStockDisplay({
      sealedPackages: row.stock_sealed_packages,
      looseBaseUnits: row.stock_loose_base_units,
      itemsPerPackage,
      packageLabel: row.package_label,
    }),
    itemsPerPackage,
    productType: (row.product_type as "unit" | "package") ?? "unit",
    purchaseMinQuantity: row.purchase_min_quantity ?? 10,
    purchaseMaxQuantity: row.purchase_max_quantity ?? 100,
  };
}

function toProductDetail(row: PublicProductRow): PublicProductDetail {
  return {
    ...toProductListItem(row),
    description: row.description,
    productType: row.product_type as "unit" | "package",
    packageLabel: row.package_label,
  };
}

function buildItemsPreview(items: PublicBundleItemRow[]) {
  return items.filter(isActiveBundleItem).map((item) => ({
    id: item.product_id,
    label: `${item.products?.name ?? "—"} × ${item.units_per_person}`,
  }));
}

function toBundleListItem(
  row: PublicBundleRow,
  items: PublicBundleItemRow[],
  containersById: Map<string, { name: string; netPrice: number }>,
): PublicBundleListItem {
  const activeItems = items.filter(isActiveBundleItem);
  const container = containersById.get(row.container_id);
  const containerNetPrice = container?.netPrice ?? 0;
  const { total } = computeBundleTotal({
    containerNetPrice,
    quantity: row.quantity,
    items: activeItems.map((item) => ({
      unitNetPrice: parseProductPricesJson(item.products?.prices ?? {})
        .unitNetPrice,
      unitsPerPerson: item.units_per_person,
    })),
  });

  return {
    id: row.id,
    name: row.name,
    imageUrl: normalizeImageUrl(row.image_url),
    quantity: row.quantity,
    containerName: container?.name ?? "—",
    total,
    itemCount: activeItems.length,
    itemsPreview: buildItemsPreview(items).slice(0, 4),
  };
}

function toBundleDetail(
  row: PublicBundleRow,
  items: PublicBundleItemRow[],
  containersById: Map<string, { name: string; netPrice: number }>,
): PublicBundleDetail {
  const activeItems = items.filter(isActiveBundleItem);

  return {
    ...toBundleListItem(row, items, containersById),
    description: row.description,
    items: activeItems.map((item) => ({
      productId: item.product_id,
      productName: item.products?.name ?? "—",
      unitsPerPerson: item.units_per_person,
    })),
  };
}

async function buildContainersMap(
  config: SupabaseConfig,
  containerIds: string[],
) {
  const containers = await getActiveContainersByIdsRepo(config, containerIds);
  return new Map(
    containers.map((container) => {
      const { name, netPrice } = getContainerNetPrice(container);
      return [container.id, { name, netPrice }] as const;
    }),
  );
}

export async function listPublicProductsService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | {
      ok: true;
      data: {
        items: PublicProductListItem[];
        page: number;
        pageSize: number;
        total: number;
      };
    }
  | { ok: false; error: "VALIDATION" }
> {
  const parsed = publicProductListQuerySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const { page, pageSize, categoryId, search, sort } = parsed.data;
  const { rows, total } = await listPublicProductsRepo(
    config,
    { categoryId, search },
    { page, pageSize, sort },
  );

  return {
    ok: true,
    data: {
      items: rows.map(toProductListItem),
      page,
      pageSize,
      total,
    },
  };
}

export async function listPublicBundlesService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | {
      ok: true;
      data: {
        items: PublicBundleListItem[];
        page: number;
        pageSize: number;
        total: number;
      };
    }
  | { ok: false; error: "VALIDATION" }
> {
  const parsed = publicBundleListQuerySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const { page, pageSize, search, sort } = parsed.data;
  const { rows, total } = await listPublicBundlesRepo(config, {
    page,
    pageSize,
    search,
    sort,
  });
  if (rows.length === 0) {
    return {
      ok: true,
      data: { items: [], page, pageSize, total },
    };
  }

  const containerIds = [...new Set(rows.map((row) => row.container_id))];
  const containersById = await buildContainersMap(config, containerIds);
  const bundleIds = rows.map((row) => row.id);
  const allItems = await listPublicBundleItemsByBundleIdsRepo(
    config,
    bundleIds,
  );

  const itemsByBundle = new Map<string, PublicBundleItemRow[]>();
  for (const item of allItems) {
    const list = itemsByBundle.get(item.bundle_id) ?? [];
    list.push(item);
    itemsByBundle.set(item.bundle_id, list);
  }

  return {
    ok: true,
    data: {
      items: rows.map((row) =>
        toBundleListItem(row, itemsByBundle.get(row.id) ?? [], containersById),
      ),
      page,
      pageSize,
      total,
    },
  };
}

export async function listPublicCategoriesService(
  config: SupabaseConfig,
): Promise<{ ok: true; data: PublicCategoryItem[] }> {
  const rows = await listPublicCategoriesRepo(config);
  return { ok: true, data: rows };
}

export async function getPublicProductService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: PublicProductDetail }
  | { ok: false; error: "VALIDATION" | "NOT_FOUND" }
> {
  const parsed = getPublicProductInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const row =
    "slug" in parsed.data
      ? await getPublicProductBySlugRepo(config, parsed.data.slug)
      : await getPublicProductByIdRepo(config, parsed.data.id);

  if (!row) return { ok: false, error: "NOT_FOUND" };
  return { ok: true, data: toProductDetail(row) };
}

export async function getPublicBundleService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: PublicBundleDetail }
  | { ok: false; error: "VALIDATION" | "NOT_FOUND" }
> {
  const parsed = getPublicBundleInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const row = await getPublicBundleByIdRepo(config, parsed.data.id);
  if (!row) return { ok: false, error: "NOT_FOUND" };

  const containersById = await buildContainersMap(config, [row.container_id]);
  const items = await listPublicBundleItemsByBundleIdsRepo(config, [row.id]);

  return {
    ok: true,
    data: toBundleDetail(row, items, containersById),
  };
}

function toPackAvailabilityComponents(
  items: PublicPackItemRow[],
): PackAvailabilityComponent[] {
  return items.map((item) => {
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
}

function isActivePackItem(item: PublicPackItemRow): boolean {
  return isActivePackAvailabilityComponent({
    packageQuantity: item.package_quantity,
    unitQuantity: item.unit_quantity ?? 0,
    product: item.products
      ? {
          isActive: item.products.is_active,
          deletedAt: item.products.deleted_at,
          productType:
            (item.products.product_type as "unit" | "package") ?? "unit",
          itemsPerPackage: item.products.items_per_package ?? 1,
          stockSealedPackages: item.products.stock_sealed_packages,
          stockLooseBaseUnits: item.products.stock_loose_base_units,
        }
      : null,
  });
}

function computePackAvailableQuantity(items: PublicPackItemRow[]): number {
  return computePackAvailableQuantityShared(
    toPackAvailabilityComponents(items),
  );
}

function buildPackItemsPreview(items: PublicPackItemRow[]) {
  return items.filter(isActivePackItem).map((item) => {
    const name = item.products?.name ?? "—";
    const pkg = item.package_quantity;
    const units = item.unit_quantity ?? 0;
    if (pkg > 0 && units > 0) {
      return {
        id: item.product_id,
        label: `${name} × ${pkg} paq. + ${units} u.`,
      };
    }
    if (units > 0 && pkg === 0) {
      return { id: item.product_id, label: `${name} × ${units} u.` };
    }
    return { id: item.product_id, label: `${name} × ${pkg}` };
  });
}

function toPackListItem(
  row: PublicPackRow,
  items: PublicPackItemRow[],
  campaign: ReturnType<typeof toCampaignForPricing> | null,
): PublicPackListItem {
  const { normalNetPrice } = parsePackPricesJson(row.prices);
  const finalPrice = computeFinalPrice(normalNetPrice, campaign);
  const availableQuantity = computePackAvailableQuantity(items);
  const purchaseMinQuantity = row.purchase_min_quantity ?? 1;
  const purchaseMaxQuantity = row.purchase_max_quantity ?? 100;

  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    imageUrl: normalizeImageUrl(row.image_url),
    finalPrice,
    itemCount: items.filter(isActivePackItem).length,
    purchaseMinQuantity,
    purchaseMaxQuantity,
    availableQuantity,
    isPurchasable: availableQuantity >= purchaseMinQuantity,
    itemsPreview: buildPackItemsPreview(items).slice(0, 4),
  };
}

function toPackDetail(
  row: PublicPackRow,
  items: PublicPackItemRow[],
  campaign: ReturnType<typeof toCampaignForPricing> | null,
): PublicPackDetail {
  const activeItems = items.filter(isActivePackItem);

  return {
    ...toPackListItem(row, items, campaign),
    description: row.description,
    items: activeItems.map((item) => ({
      productId: item.product_id,
      productName: item.products?.name ?? "—",
      description: item.products?.description ?? null,
      imageUrl: normalizeImageUrl(item.products?.image_url),
      packageQuantity: item.package_quantity,
      unitQuantity: item.unit_quantity ?? 0,
      itemsPerPackage: Math.max(1, item.products?.items_per_package ?? 1),
      productType:
        (item.products?.product_type as "unit" | "package") ?? "unit",
      packageLabel: item.products?.package_label ?? null,
    })),
  };
}

async function buildPackCampaignsById(
  config: SupabaseConfig,
  rows: PublicPackRow[],
): Promise<Map<string, ReturnType<typeof toCampaignForPricing>>> {
  const campaignIds = [
    ...new Set(
      rows
        .map((row) => row.campaign_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (campaignIds.length === 0) return new Map();

  const campaigns = await listWizardCampaignsByIdsRepo(config, campaignIds);
  return new Map(
    campaigns.map((campaign) => [campaign.id, toCampaignForPricing(campaign)]),
  );
}

export async function listPublicPacksService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | {
      ok: true;
      data: {
        items: PublicPackListItem[];
        page: number;
        pageSize: number;
        total: number;
      };
    }
  | { ok: false; error: "VALIDATION" }
> {
  const parsed = publicPackListQuerySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const { page, pageSize, search, sort } = parsed.data;
  const { rows, total } = await listPublicPacksRepo(config, {
    page,
    pageSize,
    search,
    sort,
  });
  if (rows.length === 0) {
    return {
      ok: true,
      data: { items: [], page, pageSize, total },
    };
  }

  const packIds = rows.map((row) => row.id);
  const allItems = await listPublicPackItemsByPackIdsRepo(config, packIds);
  const itemsByPack = new Map<string, PublicPackItemRow[]>();
  for (const item of allItems) {
    const list = itemsByPack.get(item.pack_id) ?? [];
    list.push(item);
    itemsByPack.set(item.pack_id, list);
  }

  const campaignsById = await buildPackCampaignsById(config, rows);

  return {
    ok: true,
    data: {
      items: rows.map((row) =>
        toPackListItem(
          row,
          itemsByPack.get(row.id) ?? [],
          row.campaign_id ? (campaignsById.get(row.campaign_id) ?? null) : null,
        ),
      ),
      page,
      pageSize,
      total,
    },
  };
}

export async function getPublicPackService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: PublicPackDetail }
  | { ok: false; error: "VALIDATION" | "NOT_FOUND" }
> {
  const parsed = getPublicPackInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const row =
    "slug" in parsed.data
      ? await getPublicPackBySlugRepo(config, parsed.data.slug)
      : await getPublicPackByIdRepo(config, parsed.data.id);
  if (!row) return { ok: false, error: "NOT_FOUND" };

  const items = await listPublicPackItemsByPackIdsRepo(config, [row.id]);
  const campaignsById = await buildPackCampaignsById(config, [row]);

  return {
    ok: true,
    data: toPackDetail(
      row,
      items,
      row.campaign_id ? (campaignsById.get(row.campaign_id) ?? null) : null,
    ),
  };
}

export async function getCartLineMetaService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | {
      ok: true;
      data: {
        products: PublicProductListItem[];
        packs: PublicPackListItem[];
      };
    }
  | { ok: false; error: "VALIDATION" }
> {
  const parsed = z
    .object({
      productIds: z.array(z.string().uuid()).default([]),
      packIds: z.array(z.string().uuid()).default([]),
    })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const productIds = [...new Set(parsed.data.productIds)];
  const packIds = [...new Set(parsed.data.packIds)];

  const [productRows, packRows, packItems] = await Promise.all([
    getPublicProductsByIdsRepo(config, productIds),
    getPublicPacksByIdsRepo(config, packIds),
    listPublicPackItemsByPackIdsRepo(config, packIds),
  ]);

  const itemsByPack = new Map<string, PublicPackItemRow[]>();
  for (const item of packItems) {
    const list = itemsByPack.get(item.pack_id) ?? [];
    list.push(item);
    itemsByPack.set(item.pack_id, list);
  }

  const campaignsById = await buildPackCampaignsById(config, packRows);

  return {
    ok: true,
    data: {
      products: productRows.map(toProductListItem),
      packs: packRows.map((row) =>
        toPackListItem(
          row,
          itemsByPack.get(row.id) ?? [],
          row.campaign_id ? (campaignsById.get(row.campaign_id) ?? null) : null,
        ),
      ),
    },
  };
}
