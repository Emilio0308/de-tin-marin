import "server-only";

import {
  createProductInputSchema,
  updateProductInputSchema,
} from "@de-tin-marin/validations/product";
import { pricesSchemaWithCoherence } from "@de-tin-marin/validations/prices";
import {
  buildPricesFromPackageNetPrice,
  roundMoney,
} from "@de-tin-marin/shared/prices";
import {
  computeFinalPrice,
  isCampaignActive,
  toCampaignForPricing,
} from "@de-tin-marin/shared/final-price";
import {
  computeTotalBaseUnits,
  formatStockDisplay,
  normalizeProductStock,
} from "@de-tin-marin/shared/product-stock";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Json } from "@de-tin-marin/types/database";
import {
  getProductByIdRepo,
  insertProductRepo,
  isProductSlugTakenRepo,
  isSkuTakenRepo,
  listCampaignsByIdsRepo,
  listProductsRepo,
  parsePricesJson,
  softDeleteProductRepo,
  updateProductRepo,
  type CampaignPricingRow,
} from "../repositories/product.repository";
import type { ProductFormDTO, ProductListItem } from "../types/product.dto";

function normalizeProductInput(input: {
  productType: "unit" | "package";
  itemsPerPackage: number;
  stockSealedPackages: number;
  stockLooseBaseUnits: number;
}) {
  if (input.productType === "unit") {
    const previousItems = Math.max(1, Math.floor(input.itemsPerPackage));
    return {
      productType: "unit" as const,
      itemsPerPackage: 1,
      stock: {
        sealedPackages: 0,
        looseBaseUnits:
          input.stockLooseBaseUnits + input.stockSealedPackages * previousItems,
      },
    };
  }

  const itemsPerPackage = Math.max(2, Math.floor(input.itemsPerPackage));
  return {
    productType: "package" as const,
    itemsPerPackage,
    stock: normalizeProductStock(
      input.stockSealedPackages,
      input.stockLooseBaseUnits,
      itemsPerPackage,
    ),
  };
}

function toListItem(
  row: Awaited<ReturnType<typeof listProductsRepo>>[number],
  campaign: CampaignPricingRow | null,
): ProductListItem {
  const { packageNetPrice, unitNetPrice } = parsePricesJson(row.prices);
  const itemsPerPackage = row.items_per_package;
  const campaignForPricing = campaign ? toCampaignForPricing(campaign) : null;
  const finalPrice = computeFinalPrice(packageNetPrice, campaignForPricing);
  const finalUnitPrice =
    campaignForPricing && isCampaignActive(campaignForPricing)
      ? roundMoney(finalPrice / itemsPerPackage)
      : unitNetPrice;
  const stockTotalBaseUnits = computeTotalBaseUnits(
    row.stock_sealed_packages,
    row.stock_loose_base_units,
    itemsPerPackage,
  );

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? "—",
    productType: row.product_type as "unit" | "package",
    itemsPerPackage,
    packageLabel: row.package_label,
    netPrice: packageNetPrice,
    unitNetPrice,
    finalPrice,
    finalUnitPrice,
    campaign:
      campaign && isCampaignActive(campaignForPricing)
        ? {
            id: campaign.id,
            name: campaign.name,
            percentage: Number(campaign.percentage),
          }
        : null,
    stockSealedPackages: row.stock_sealed_packages,
    stockLooseBaseUnits: row.stock_loose_base_units,
    stockTotalBaseUnits,
    stockDisplay: formatStockDisplay({
      sealedPackages: row.stock_sealed_packages,
      looseBaseUnits: row.stock_loose_base_units,
      itemsPerPackage,
      packageLabel: row.package_label,
    }),
    isActive: row.is_active,
    imageUrl: row.image_url,
  };
}

function toFormDTO(
  row: NonNullable<Awaited<ReturnType<typeof getProductByIdRepo>>>,
): ProductFormDTO {
  const { packageNetPrice, unitNetPrice } = parsePricesJson(row.prices);
  const itemsPerPackage = row.items_per_package ?? 1;

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    slug: row.slug,
    brand: row.brand,
    productType: (row.product_type as "unit" | "package") ?? "unit",
    itemsPerPackage,
    packageLabel: row.package_label,
    packageNetPrice,
    unitNetPrice,
    stockSealedPackages: row.stock_sealed_packages ?? 0,
    stockLooseBaseUnits: row.stock_loose_base_units ?? 0,
    stockTotalBaseUnits: computeTotalBaseUnits(
      row.stock_sealed_packages ?? 0,
      row.stock_loose_base_units ?? 0,
      itemsPerPackage,
    ),
    categoryId: row.category_id,
    imageUrl: row.image_url,
    isActive: row.is_active,
  };
}

function normalizeImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || imageUrl.trim() === "") return null;
  return imageUrl;
}

export async function listProductsService(
  config: SupabaseConfig,
): Promise<ProductListItem[]> {
  const rows = await listProductsRepo(config);
  if (rows.length === 0) return [];

  const campaignIds = [
    ...new Set(
      rows
        .map((row) => row.campaign_id)
        .filter((id): id is string => id !== null),
    ),
  ];
  const campaigns = await listCampaignsByIdsRepo(config, campaignIds);
  const campaignById = new Map(
    campaigns.map((campaign) => [campaign.id, campaign]),
  );

  return rows.map((row) =>
    toListItem(
      row,
      row.campaign_id ? (campaignById.get(row.campaign_id) ?? null) : null,
    ),
  );
}

export async function getProductService(
  config: SupabaseConfig,
  id: string,
): Promise<ProductFormDTO | null> {
  const row = await getProductByIdRepo(config, id);
  return row ? toFormDTO(row) : null;
}

export async function createProductService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = createProductInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION",
      details: parsed.error.flatten(),
    };
  }

  const data = parsed.data;
  const normalized = normalizeProductInput({
    productType: data.productType,
    itemsPerPackage: data.itemsPerPackage,
    stockSealedPackages: data.stockSealedPackages,
    stockLooseBaseUnits: data.stockLooseBaseUnits,
  });
  const itemsPerPackage = normalized.itemsPerPackage;
  const prices = buildPricesFromPackageNetPrice(
    data.packageNetPrice,
    itemsPerPackage,
  );
  const priceCheck =
    pricesSchemaWithCoherence(itemsPerPackage).safeParse(prices);
  if (!priceCheck.success) {
    return { ok: false as const, error: "INVALID_PRICE" };
  }

  const skuTaken = await isSkuTakenRepo(config, data.sku);
  if (skuTaken) {
    return { ok: false as const, error: "SKU_TAKEN" };
  }

  const slugTaken = await isProductSlugTakenRepo(config, data.slug);
  if (slugTaken) {
    return { ok: false as const, error: "SLUG_TAKEN" };
  }

  const row = await insertProductRepo(config, {
    sku: data.sku,
    name: data.name,
    description: data.description ?? null,
    slug: data.slug,
    brand: data.brand ?? null,
    product_type: normalized.productType,
    items_per_package: itemsPerPackage,
    package_label:
      normalized.productType === "package"
        ? data.packageLabel?.trim() || null
        : null,
    prices: priceCheck.data as Json,
    image_url: normalizeImageUrl(data.imageUrl),
    stock_sealed_packages: normalized.stock.sealedPackages,
    stock_loose_base_units: normalized.stock.looseBaseUnits,
    category_id: data.categoryId,
    is_active: data.isActive,
  });

  return { ok: true as const, id: row.id };
}

export async function updateProductService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = updateProductInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION",
      details: parsed.error.flatten(),
    };
  }

  const { id, ...fields } = parsed.data;
  const existing = await getProductByIdRepo(config, id);
  if (!existing) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  if (fields.sku) {
    const skuTaken = await isSkuTakenRepo(config, fields.sku, id);
    if (skuTaken) {
      return { ok: false as const, error: "SKU_TAKEN" };
    }
  }

  if (fields.slug) {
    const slugTaken = await isProductSlugTakenRepo(config, fields.slug, id);
    if (slugTaken) {
      return { ok: false as const, error: "SLUG_TAKEN" };
    }
  }

  const itemsPerPackage =
    fields.itemsPerPackage ?? existing.items_per_package ?? 1;
  const productType =
    fields.productType ??
    (existing.product_type as "unit" | "package") ??
    "unit";
  const normalized = normalizeProductInput({
    productType,
    itemsPerPackage,
    stockSealedPackages:
      fields.stockSealedPackages ?? existing.stock_sealed_packages ?? 0,
    stockLooseBaseUnits:
      fields.stockLooseBaseUnits ?? existing.stock_loose_base_units ?? 0,
  });
  const updatePayload: Parameters<typeof updateProductRepo>[2] = {};

  if (fields.sku !== undefined) updatePayload.sku = fields.sku;
  if (fields.name !== undefined) updatePayload.name = fields.name;
  if (fields.description !== undefined)
    updatePayload.description = fields.description ?? null;
  if (fields.slug !== undefined) updatePayload.slug = fields.slug;
  if (fields.brand !== undefined) updatePayload.brand = fields.brand ?? null;
  if (fields.categoryId !== undefined)
    updatePayload.category_id = fields.categoryId;
  if (fields.imageUrl !== undefined)
    updatePayload.image_url = normalizeImageUrl(fields.imageUrl);
  if (fields.isActive !== undefined) updatePayload.is_active = fields.isActive;
  updatePayload.items_per_package = normalized.itemsPerPackage;
  updatePayload.product_type = normalized.productType;
  if (fields.packageLabel !== undefined || fields.productType !== undefined) {
    updatePayload.package_label =
      normalized.productType === "package"
        ? (fields.packageLabel ?? existing.package_label ?? "")?.trim() || null
        : null;
  }

  if (
    fields.packageNetPrice !== undefined ||
    fields.itemsPerPackage !== undefined ||
    fields.productType !== undefined
  ) {
    const packageNetPrice =
      fields.packageNetPrice ??
      parsePricesJson(existing.prices).packageNetPrice;
    const prices = buildPricesFromPackageNetPrice(
      packageNetPrice,
      normalized.itemsPerPackage,
    );
    const priceCheck = pricesSchemaWithCoherence(
      normalized.itemsPerPackage,
    ).safeParse(prices);
    if (!priceCheck.success) {
      return { ok: false as const, error: "INVALID_PRICE" };
    }
    updatePayload.prices = priceCheck.data as Json;
  }

  if (
    fields.stockSealedPackages !== undefined ||
    fields.stockLooseBaseUnits !== undefined ||
    fields.itemsPerPackage !== undefined ||
    fields.productType !== undefined
  ) {
    updatePayload.stock_sealed_packages = normalized.stock.sealedPackages;
    updatePayload.stock_loose_base_units = normalized.stock.looseBaseUnits;
  }

  await updateProductRepo(config, id, updatePayload);
  return { ok: true as const };
}

export async function softDeleteProductService(
  config: SupabaseConfig,
  id: string,
) {
  await softDeleteProductRepo(config, id);
  return { ok: true as const };
}
