import "server-only";

import {
  createProductInputSchema,
  updateProductInputSchema,
} from "@de-tin-marin/validations/product";
import { pricesSchema } from "@de-tin-marin/validations/prices";
import { buildPricesFromNetPrice } from "@de-tin-marin/shared/prices";
import {
  computeFinalPrice,
  isCampaignActive,
  toCampaignForPricing,
} from "@de-tin-marin/shared/final-price";
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

function toListItem(
  row: Awaited<ReturnType<typeof listProductsRepo>>[number],
  campaign: CampaignPricingRow | null,
): ProductListItem {
  const { netPrice } = parsePricesJson(row.prices);
  const campaignForPricing = campaign ? toCampaignForPricing(campaign) : null;
  const finalPrice = computeFinalPrice(netPrice, campaignForPricing);

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? "—",
    netPrice,
    finalPrice,
    campaign:
      campaign && isCampaignActive(campaignForPricing)
        ? {
            id: campaign.id,
            name: campaign.name,
            percentage: Number(campaign.percentage),
          }
        : null,
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
    imageUrl: row.image_url,
  };
}

function toFormDTO(
  row: NonNullable<Awaited<ReturnType<typeof getProductByIdRepo>>>,
): ProductFormDTO {
  const { netPrice } = parsePricesJson(row.prices);
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    slug: row.slug,
    brand: row.brand,
    netPrice,
    stockQuantity: row.stock_quantity,
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
  const skuTaken = await isSkuTakenRepo(config, data.sku);
  if (skuTaken) {
    return { ok: false as const, error: "SKU_TAKEN" };
  }

  const slugTaken = await isProductSlugTakenRepo(config, data.slug);
  if (slugTaken) {
    return { ok: false as const, error: "SLUG_TAKEN" };
  }

  const prices = buildPricesFromNetPrice(data.netPrice);
  const priceCheck = pricesSchema.safeParse(prices);
  if (!priceCheck.success) {
    return { ok: false as const, error: "INVALID_PRICE" };
  }

  const row = await insertProductRepo(config, {
    sku: data.sku,
    name: data.name,
    description: data.description ?? null,
    slug: data.slug,
    brand: data.brand ?? null,
    prices: priceCheck.data as Json,
    image_url: normalizeImageUrl(data.imageUrl),
    stock_quantity: data.stockQuantity,
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

  const updatePayload: Parameters<typeof updateProductRepo>[2] = {};

  if (fields.sku !== undefined) updatePayload.sku = fields.sku;
  if (fields.name !== undefined) updatePayload.name = fields.name;
  if (fields.description !== undefined)
    updatePayload.description = fields.description ?? null;
  if (fields.slug !== undefined) updatePayload.slug = fields.slug;
  if (fields.brand !== undefined) updatePayload.brand = fields.brand ?? null;
  if (fields.stockQuantity !== undefined)
    updatePayload.stock_quantity = fields.stockQuantity;
  if (fields.categoryId !== undefined)
    updatePayload.category_id = fields.categoryId;
  if (fields.imageUrl !== undefined)
    updatePayload.image_url = normalizeImageUrl(fields.imageUrl);
  if (fields.isActive !== undefined) updatePayload.is_active = fields.isActive;

  if (fields.netPrice !== undefined) {
    const prices = buildPricesFromNetPrice(fields.netPrice);
    const priceCheck = pricesSchema.safeParse(prices);
    if (!priceCheck.success) {
      return { ok: false as const, error: "INVALID_PRICE" };
    }
    updatePayload.prices = priceCheck.data as Json;
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
