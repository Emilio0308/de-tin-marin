import "server-only";

import {
  createPackInputSchema,
  updatePackInputSchema,
} from "@de-tin-marin/validations/pack";
import {
  adminPackListQuerySchema,
  type AdminListPage,
} from "@de-tin-marin/validations/admin-list";
import { computePackReference } from "@de-tin-marin/shared/pack-price";
import {
  buildPackPrices,
  parsePackPricesJson,
  parseProductPricesJson,
} from "@de-tin-marin/shared/prices";
import {
  computeFinalPrice,
  isCampaignActive,
  toCampaignForPricing,
} from "@de-tin-marin/shared/final-price";
import { slugify } from "@de-tin-marin/shared/slugify";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { getActiveProductsByIdsRepo } from "../repositories/bundle.repository";
import {
  listCampaignsByIdsRepo,
  listProductsRepo,
  type CampaignPricingRow,
} from "../repositories/product.repository";
import {
  getPackByIdRepo,
  hardDeletePackRepo,
  insertPackRepo,
  isPackSkuTakenRepo,
  isPackSlugTakenRepo,
  listPackItemsByPackIdsRepo,
  listPacksPageRepo,
  listPacksRepo,
  replacePackItemsRepo,
  softDeletePackRepo,
  updatePackRepo,
  type PackItemWithProduct,
  type PackRow,
} from "../repositories/pack.repository";
import { bumpCatalogVersionSafe } from "../repositories/catalog-cache-meta.repository";
import type { PackFormDTO, PackFormItemDTO } from "../types/pack.dto";
import type { PackListItem } from "@de-tin-marin/validations/pack";

function normalizeImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || imageUrl.trim() === "") return null;
  return imageUrl;
}

function toPriceItems(items: PackItemWithProduct[]) {
  return items.map((item) => ({
    packageNetPrice: parseProductPricesJson(item.products?.prices ?? {})
      .packageNetPrice,
    packageQuantity: item.package_quantity,
  }));
}

function computeReferenceFromItems(
  items: { packageNetPrice: number; packageQuantity: number }[],
): number {
  return computePackReference(items).referenceNetPrice;
}

function toFormItemDTO(item: PackItemWithProduct): PackFormItemDTO {
  return {
    productId: item.product_id,
    productName: item.products?.name ?? "—",
    packageNetPrice: parseProductPricesJson(item.products?.prices ?? {})
      .packageNetPrice,
    packageQuantity: item.package_quantity,
  };
}

function resolveFinalPrice(
  normalNetPrice: number,
  campaign: CampaignPricingRow | null,
): number {
  const campaignForPricing = campaign ? toCampaignForPricing(campaign) : null;
  return computeFinalPrice(normalNetPrice, campaignForPricing);
}

function toListItem(
  row: PackRow,
  items: PackItemWithProduct[],
  campaign: CampaignPricingRow | null,
): PackListItem {
  const { normalNetPrice, referenceNetPrice } = parsePackPricesJson(row.prices);
  const finalPrice = resolveFinalPrice(normalNetPrice, campaign);
  const campaignForPricing = campaign ? toCampaignForPricing(campaign) : null;

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    imageUrl: row.image_url,
    normalPrice: normalNetPrice,
    referencePrice: referenceNetPrice,
    finalPrice,
    itemCount: items.length,
    purchaseMinQuantity: row.purchase_min_quantity,
    purchaseMaxQuantity: row.purchase_max_quantity,
    isActive: row.is_active,
    campaign:
      campaign && isCampaignActive(campaignForPricing)
        ? {
            id: campaign.id,
            name: campaign.name,
            percentage: Number(campaign.percentage),
          }
        : null,
  };
}

function toFormDTO(
  row: PackRow,
  items: PackItemWithProduct[],
  campaign: CampaignPricingRow | null,
): PackFormDTO {
  const { normalNetPrice, referenceNetPrice } = parsePackPricesJson(row.prices);
  const finalPrice = resolveFinalPrice(normalNetPrice, campaign);

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    slug: row.slug,
    imageUrl: row.image_url,
    normalNetPrice,
    referenceNetPrice,
    finalPrice,
    campaignId: row.campaign_id,
    purchaseMinQuantity: row.purchase_min_quantity,
    purchaseMaxQuantity: row.purchase_max_quantity,
    isActive: row.is_active,
    items: items.map(toFormItemDTO),
  };
}

function hasDuplicateProductIds(productIds: string[]): boolean {
  return new Set(productIds).size !== productIds.length;
}

async function validatePackItems(
  config: SupabaseConfig,
  items: { productId: string }[],
) {
  const productIds = items.map((item) => item.productId);

  if (hasDuplicateProductIds(productIds)) {
    return { ok: false as const, error: "DUPLICATE_PRODUCT" as const };
  }

  const activeProducts = await getActiveProductsByIdsRepo(config, productIds);
  if (activeProducts.length !== productIds.length) {
    return { ok: false as const, error: "PRODUCT_NOT_FOUND" as const };
  }

  return { ok: true as const };
}

async function validateCampaign(
  config: SupabaseConfig,
  campaignId: string | null | undefined,
) {
  if (!campaignId) return { ok: true as const };

  const campaigns = await listCampaignsByIdsRepo(config, [campaignId]);
  if (campaigns.length === 0) {
    return { ok: false as const, error: "CAMPAIGN_NOT_FOUND" as const };
  }

  return { ok: true as const };
}

async function resolveReferenceNetPrice(
  config: SupabaseConfig,
  itemsInput: { productId: string; packageQuantity: number }[] | undefined,
  existingItems: PackItemWithProduct[],
): Promise<
  | { ok: true; referenceNetPrice: number }
  | { ok: false; error: "PRODUCT_NOT_FOUND" | "DUPLICATE_PRODUCT" }
> {
  if (itemsInput) {
    const itemsCheck = await validatePackItems(config, itemsInput);
    if (!itemsCheck.ok) {
      return { ok: false, error: itemsCheck.error };
    }

    const allProducts = await listProductsRepo(config);
    const priceById = new Map(
      allProducts.map((product) => [
        product.id,
        parseProductPricesJson(product.prices).packageNetPrice,
      ]),
    );

    const referenceNetPrice = computeReferenceFromItems(
      itemsInput.map((item) => ({
        packageNetPrice: priceById.get(item.productId) ?? 0,
        packageQuantity: item.packageQuantity,
      })),
    );

    return { ok: true, referenceNetPrice };
  }

  return {
    ok: true,
    referenceNetPrice: computeReferenceFromItems(toPriceItems(existingItems)),
  };
}

export async function listPacksService(
  config: SupabaseConfig,
): Promise<PackListItem[]> {
  const rows = await listPacksRepo(config);
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

  const packIds = rows.map((row) => row.id);
  const allItems = await listPackItemsByPackIdsRepo(config, packIds);

  const itemsByPack = new Map<string, PackItemWithProduct[]>();
  for (const item of allItems) {
    const list = itemsByPack.get(item.pack_id) ?? [];
    list.push(item);
    itemsByPack.set(item.pack_id, list);
  }

  return rows.map((row) =>
    toListItem(
      row,
      itemsByPack.get(row.id) ?? [],
      row.campaign_id ? (campaignById.get(row.campaign_id) ?? null) : null,
    ),
  );
}

export async function listPacksPageService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: AdminListPage<PackListItem> }
  | { ok: false; error: "VALIDATION" }
> {
  const parsed = adminPackListQuerySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const { page, pageSize, search, status } = parsed.data;
  const { rows, total } = await listPacksPageRepo(
    config,
    { search, status },
    { page, pageSize },
  );

  if (rows.length === 0) {
    return { ok: true, data: { items: [], page, pageSize, total } };
  }

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

  const packIds = rows.map((row) => row.id);
  const allItems = await listPackItemsByPackIdsRepo(config, packIds);

  const itemsByPack = new Map<string, PackItemWithProduct[]>();
  for (const item of allItems) {
    const list = itemsByPack.get(item.pack_id) ?? [];
    list.push(item);
    itemsByPack.set(item.pack_id, list);
  }

  const items = rows.map((row) =>
    toListItem(
      row,
      itemsByPack.get(row.id) ?? [],
      row.campaign_id ? (campaignById.get(row.campaign_id) ?? null) : null,
    ),
  );

  return { ok: true, data: { items, page, pageSize, total } };
}

export async function getPackService(
  config: SupabaseConfig,
  id: string,
): Promise<PackFormDTO | null> {
  const row = await getPackByIdRepo(config, id);
  if (!row) return null;

  const campaign = row.campaign_id
    ? ((await listCampaignsByIdsRepo(config, [row.campaign_id]))[0] ?? null)
    : null;

  return toFormDTO(row, row.pack_items ?? [], campaign);
}

export async function createPackService(config: SupabaseConfig, raw: unknown) {
  const parsed = createPackInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION",
      details: parsed.error.flatten(),
    };
  }

  const data = parsed.data;
  const itemsCheck = await validatePackItems(config, data.items);
  if (!itemsCheck.ok) {
    return { ok: false as const, error: itemsCheck.error };
  }

  const campaignCheck = await validateCampaign(config, data.campaignId);
  if (!campaignCheck.ok) {
    return { ok: false as const, error: campaignCheck.error };
  }

  const allProducts = await listProductsRepo(config);
  const priceById = new Map(
    allProducts.map((product) => [
      product.id,
      parseProductPricesJson(product.prices).packageNetPrice,
    ]),
  );

  const referenceNetPrice = computeReferenceFromItems(
    data.items.map((item) => ({
      packageNetPrice: priceById.get(item.productId) ?? 0,
      packageQuantity: item.packageQuantity,
    })),
  );

  if (data.normalNetPrice < referenceNetPrice) {
    return { ok: false as const, error: "PRICE_BELOW_REFERENCE" as const };
  }

  const slug = data.slug?.trim() ? data.slug.trim() : slugify(data.name);

  const skuTaken = await isPackSkuTakenRepo(config, data.sku);
  if (skuTaken) {
    return { ok: false as const, error: "SKU_TAKEN" as const };
  }

  const slugTaken = await isPackSlugTakenRepo(config, slug);
  if (slugTaken) {
    return { ok: false as const, error: "SLUG_TAKEN" as const };
  }

  const prices = buildPackPrices(data.normalNetPrice, referenceNetPrice);

  const row = await insertPackRepo(config, {
    sku: data.sku,
    name: data.name,
    description: data.description ?? null,
    slug,
    image_url: normalizeImageUrl(data.imageUrl),
    prices,
    campaign_id: data.campaignId ?? null,
    purchase_min_quantity: data.purchaseMinQuantity,
    purchase_max_quantity: data.purchaseMaxQuantity,
    is_active: data.isActive,
  });

  try {
    await replacePackItemsRepo(
      config,
      row.id,
      data.items.map((item) => ({
        product_id: item.productId,
        package_quantity: item.packageQuantity,
      })),
    );
  } catch (error) {
    await hardDeletePackRepo(config, row.id);
    throw error;
  }

  await bumpCatalogVersionSafe(config);
  return { ok: true as const, id: row.id };
}

export async function updatePackService(config: SupabaseConfig, raw: unknown) {
  const parsed = updatePackInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION",
      details: parsed.error.flatten(),
    };
  }

  const { id, ...fields } = parsed.data;
  const existing = await getPackByIdRepo(config, id);
  if (!existing) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  if (fields.items) {
    const itemsCheck = await validatePackItems(config, fields.items);
    if (!itemsCheck.ok) {
      return { ok: false as const, error: itemsCheck.error };
    }
  }

  if (fields.campaignId !== undefined) {
    const campaignCheck = await validateCampaign(config, fields.campaignId);
    if (!campaignCheck.ok) {
      return { ok: false as const, error: campaignCheck.error };
    }
  }

  const existingItems = existing.pack_items ?? [];
  const referenceResult = await resolveReferenceNetPrice(
    config,
    fields.items,
    existingItems,
  );
  if (!referenceResult.ok) {
    return { ok: false as const, error: referenceResult.error };
  }

  const referenceNetPrice = referenceResult.referenceNetPrice;
  const { normalNetPrice: existingNormal } = parsePackPricesJson(
    existing.prices,
  );
  const normalNetPrice = fields.normalNetPrice ?? existingNormal;

  if (normalNetPrice < referenceNetPrice) {
    return { ok: false as const, error: "PRICE_BELOW_REFERENCE" as const };
  }

  if (fields.sku !== undefined) {
    const skuTaken = await isPackSkuTakenRepo(config, fields.sku, id);
    if (skuTaken) {
      return { ok: false as const, error: "SKU_TAKEN" as const };
    }
  }

  const nextSlug = fields.slug !== undefined ? fields.slug.trim() : undefined;

  if (nextSlug !== undefined) {
    const slugTaken = await isPackSlugTakenRepo(config, nextSlug, id);
    if (slugTaken) {
      return { ok: false as const, error: "SLUG_TAKEN" as const };
    }
  }

  const prices = buildPackPrices(normalNetPrice, referenceNetPrice);
  const updatePayload: Parameters<typeof updatePackRepo>[2] = {
    prices,
  };

  if (fields.sku !== undefined) updatePayload.sku = fields.sku;
  if (fields.name !== undefined) updatePayload.name = fields.name;
  if (fields.description !== undefined)
    updatePayload.description = fields.description ?? null;
  if (nextSlug !== undefined) updatePayload.slug = nextSlug;
  if (fields.imageUrl !== undefined)
    updatePayload.image_url = normalizeImageUrl(fields.imageUrl);
  if (fields.campaignId !== undefined)
    updatePayload.campaign_id = fields.campaignId ?? null;
  if (fields.purchaseMinQuantity !== undefined)
    updatePayload.purchase_min_quantity = fields.purchaseMinQuantity;
  if (fields.purchaseMaxQuantity !== undefined)
    updatePayload.purchase_max_quantity = fields.purchaseMaxQuantity;
  if (fields.isActive !== undefined) updatePayload.is_active = fields.isActive;

  await updatePackRepo(config, id, updatePayload);

  if (fields.items) {
    await replacePackItemsRepo(
      config,
      id,
      fields.items.map((item) => ({
        product_id: item.productId,
        package_quantity: item.packageQuantity,
      })),
    );
  }

  await bumpCatalogVersionSafe(config);
  return { ok: true as const };
}

export async function softDeletePackService(
  config: SupabaseConfig,
  id: string,
) {
  const existing = await getPackByIdRepo(config, id);
  if (!existing) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  await softDeletePackRepo(config, id);
  await bumpCatalogVersionSafe(config);
  return { ok: true as const };
}
