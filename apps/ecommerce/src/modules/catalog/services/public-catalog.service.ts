import "server-only";

import { computeBundleTotal } from "@de-tin-marin/shared/bundle-price";
import { computeFinalPrice } from "@de-tin-marin/shared/final-price";
import { parseProductPricesJson } from "@de-tin-marin/shared/prices";
import {
  computeTotalBaseUnits,
  formatStockDisplay,
} from "@de-tin-marin/shared/product-stock";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  getPublicBundleInputSchema,
  getPublicProductInputSchema,
  paginateItems,
  publicBundleListQuerySchema,
  publicProductListQuerySchema,
  sortPublicBundles,
  sortPublicProducts,
  type PublicBundleDetail,
  type PublicBundleListItem,
  type PublicCategoryItem,
  type PublicProductDetail,
  type PublicProductListItem,
} from "@de-tin-marin/validations/public-catalog";
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
  getPublicProductByIdRepo,
  getPublicProductBySlugRepo,
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
  const rows = await listPublicProductsRepo(config, { categoryId, search });
  const mapped = rows.map(toProductListItem);
  const sorted = sortPublicProducts(mapped, sort) as PublicProductListItem[];

  return { ok: true, data: paginateItems(sorted, page, pageSize) };
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
  const rows = await listPublicBundlesRepo(config, { search });
  if (rows.length === 0) {
    return {
      ok: true,
      data: { items: [], page, pageSize, total: 0 },
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

  const mapped = rows.map((row) =>
    toBundleListItem(row, itemsByBundle.get(row.id) ?? [], containersById),
  );
  const sorted = sortPublicBundles(mapped, sort) as PublicBundleListItem[];

  return { ok: true, data: paginateItems(sorted, page, pageSize) };
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
