import "server-only";

import {
  createSurpriseContainerInputSchema,
  updateSurpriseContainerInputSchema,
} from "@de-tin-marin/validations/surprise-container";
import { buildSinglePriceFromNetPrice } from "@de-tin-marin/shared/prices";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  countActiveBundlesByContainerIdRepo,
  getSurpriseContainerByIdRepo,
  insertSurpriseContainerRepo,
  isContainerSkuTakenRepo,
  listSurpriseContainersRepo,
  parseContainerPricesJson,
  softDeleteSurpriseContainerRepo,
  updateSurpriseContainerRepo,
} from "../repositories/surprise-container.repository";
import type {
  SurpriseContainerFormDTO,
  SurpriseContainerListItem,
} from "../types/surprise-container.dto";

function normalizeImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || imageUrl.trim() === "") return null;
  return imageUrl;
}

function toListItem(
  row: Awaited<ReturnType<typeof listSurpriseContainersRepo>>[number],
): SurpriseContainerListItem {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    netPrice: parseContainerPricesJson(row.prices).netPrice,
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
  };
}

function toFormDTO(
  row: NonNullable<Awaited<ReturnType<typeof getSurpriseContainerByIdRepo>>>,
): SurpriseContainerFormDTO {
  const prices = parseContainerPricesJson(row.prices);
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    netPrice: prices.netPrice,
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
  };
}

export async function listSurpriseContainersService(
  config: SupabaseConfig,
): Promise<SurpriseContainerListItem[]> {
  const rows = await listSurpriseContainersRepo(config);
  return rows.map(toListItem);
}

export async function getSurpriseContainerService(
  config: SupabaseConfig,
  id: string,
): Promise<SurpriseContainerFormDTO | null> {
  const row = await getSurpriseContainerByIdRepo(config, id);
  if (!row) return null;
  return toFormDTO(row);
}

export async function createSurpriseContainerService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = createSurpriseContainerInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  const data = parsed.data;
  if (await isContainerSkuTakenRepo(config, data.sku)) {
    return { ok: false as const, error: "DUPLICATE_SKU" as const };
  }

  const prices = buildSinglePriceFromNetPrice(data.netPrice);
  const row = await insertSurpriseContainerRepo(config, {
    sku: data.sku,
    name: data.name,
    description: data.description ?? null,
    image_url: normalizeImageUrl(data.imageUrl),
    prices,
    stock_quantity: data.stockQuantity,
    is_active: data.isActive,
  });

  return { ok: true as const, id: row.id };
}

export async function updateSurpriseContainerService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = updateSurpriseContainerInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  const { id, ...fields } = parsed.data;
  const existing = await getSurpriseContainerByIdRepo(config, id);
  if (!existing) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  if (fields.sku && (await isContainerSkuTakenRepo(config, fields.sku, id))) {
    return { ok: false as const, error: "DUPLICATE_SKU" as const };
  }

  const updatePayload: Parameters<typeof updateSurpriseContainerRepo>[2] = {};

  if (fields.sku !== undefined) updatePayload.sku = fields.sku;
  if (fields.name !== undefined) updatePayload.name = fields.name;
  if (fields.description !== undefined)
    updatePayload.description = fields.description ?? null;
  if (fields.imageUrl !== undefined)
    updatePayload.image_url = normalizeImageUrl(fields.imageUrl);
  if (fields.netPrice !== undefined) {
    updatePayload.prices = buildSinglePriceFromNetPrice(fields.netPrice);
  }
  if (fields.stockQuantity !== undefined)
    updatePayload.stock_quantity = fields.stockQuantity;
  if (fields.isActive !== undefined) updatePayload.is_active = fields.isActive;

  if (Object.keys(updatePayload).length > 0) {
    await updateSurpriseContainerRepo(config, id, updatePayload);
  }

  return { ok: true as const };
}

export async function softDeleteSurpriseContainerService(
  config: SupabaseConfig,
  id: string,
) {
  const existing = await getSurpriseContainerByIdRepo(config, id);
  if (!existing) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  const bundleCount = await countActiveBundlesByContainerIdRepo(config, id);
  if (bundleCount > 0) {
    return { ok: false as const, error: "CONTAINER_IN_USE" as const };
  }

  await softDeleteSurpriseContainerRepo(config, id);
  return { ok: true as const };
}
