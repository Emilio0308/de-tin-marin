import "server-only";

import {
  createBundleInputSchema,
  updateBundleInputSchema,
} from "@de-tin-marin/validations/bundle";
import { computeBundleTotal } from "@de-tin-marin/shared/bundle-price";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { parsePricesJson } from "../repositories/product.repository";
import {
  getActiveProductsByIdsRepo,
  getBundleByIdRepo,
  hardDeleteBundleRepo,
  insertBundleRepo,
  listBundleItemsByBundleIdsRepo,
  listBundlesRepo,
  replaceBundleItemsRepo,
  softDeleteBundleRepo,
  updateBundleRepo,
  type BundleItemWithProduct,
  type BundleRow,
} from "../repositories/bundle.repository";
import type {
  BundleFormDTO,
  BundleFormItemDTO,
  BundleListItem,
} from "../types/bundle.dto";

function normalizeImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || imageUrl.trim() === "") return null;
  return imageUrl;
}

function toPriceItems(items: BundleItemWithProduct[]) {
  return items.map((item) => ({
    unitNetPrice: parsePricesJson(item.products?.prices ?? {}).netPrice,
    unitsPerPerson: item.units_per_person,
  }));
}

function toFormItemDTO(item: BundleItemWithProduct): BundleFormItemDTO {
  return {
    productId: item.product_id,
    productName: item.products?.name ?? "—",
    unitNetPrice: parsePricesJson(item.products?.prices ?? {}).netPrice,
    unitsPerPerson: item.units_per_person,
  };
}

function toListItem(
  row: BundleRow,
  items: BundleItemWithProduct[],
): BundleListItem {
  const { total } = computeBundleTotal({
    serviceFee: Number(row.service_fee),
    quantity: row.quantity,
    items: toPriceItems(items),
  });

  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    serviceFee: Number(row.service_fee),
    quantity: row.quantity,
    itemCount: items.length,
    total,
    isActive: row.is_active,
  };
}

function toFormDTO(
  row: BundleRow,
  items: BundleItemWithProduct[],
): BundleFormDTO {
  const { itemsSubtotal, total } = computeBundleTotal({
    serviceFee: Number(row.service_fee),
    quantity: row.quantity,
    items: toPriceItems(items),
  });

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    serviceFee: Number(row.service_fee),
    quantity: row.quantity,
    isActive: row.is_active,
    items: items.map(toFormItemDTO),
    itemsSubtotal,
    total,
  };
}

function hasDuplicateProductIds(productIds: string[]): boolean {
  return new Set(productIds).size !== productIds.length;
}

async function validateBundleItems(
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

export async function listBundlesService(
  config: SupabaseConfig,
): Promise<BundleListItem[]> {
  const rows = await listBundlesRepo(config);
  if (rows.length === 0) return [];

  const bundleIds = rows.map((row) => row.id);
  const allItems = await listBundleItemsByBundleIdsRepo(config, bundleIds);

  const itemsByBundle = new Map<string, BundleItemWithProduct[]>();
  for (const item of allItems) {
    const list = itemsByBundle.get(item.bundle_id) ?? [];
    list.push(item);
    itemsByBundle.set(item.bundle_id, list);
  }

  return rows.map((row) => toListItem(row, itemsByBundle.get(row.id) ?? []));
}

export async function getBundleService(
  config: SupabaseConfig,
  id: string,
): Promise<BundleFormDTO | null> {
  const row = await getBundleByIdRepo(config, id);
  if (!row) return null;
  return toFormDTO(row, row.bundle_items ?? []);
}

export async function createBundleService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = createBundleInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION",
      details: parsed.error.flatten(),
    };
  }

  const data = parsed.data;
  const itemsCheck = await validateBundleItems(config, data.items);
  if (!itemsCheck.ok) {
    return { ok: false as const, error: itemsCheck.error };
  }

  const row = await insertBundleRepo(config, {
    name: data.name,
    description: data.description ?? null,
    image_url: normalizeImageUrl(data.imageUrl),
    service_fee: data.serviceFee,
    quantity: data.quantity,
    is_active: data.isActive,
  });

  try {
    await replaceBundleItemsRepo(
      config,
      row.id,
      data.items.map((item) => ({
        product_id: item.productId,
        units_per_person: item.unitsPerPerson,
      })),
    );
  } catch (error) {
    await hardDeleteBundleRepo(config, row.id);
    throw error;
  }

  return { ok: true as const, id: row.id };
}

export async function updateBundleService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = updateBundleInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION",
      details: parsed.error.flatten(),
    };
  }

  const { id, ...fields } = parsed.data;
  const existing = await getBundleByIdRepo(config, id);
  if (!existing) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  if (fields.items) {
    const itemsCheck = await validateBundleItems(config, fields.items);
    if (!itemsCheck.ok) {
      return { ok: false as const, error: itemsCheck.error };
    }
  }

  const updatePayload: Parameters<typeof updateBundleRepo>[2] = {};

  if (fields.name !== undefined) updatePayload.name = fields.name;
  if (fields.description !== undefined)
    updatePayload.description = fields.description ?? null;
  if (fields.imageUrl !== undefined)
    updatePayload.image_url = normalizeImageUrl(fields.imageUrl);
  if (fields.serviceFee !== undefined)
    updatePayload.service_fee = fields.serviceFee;
  if (fields.quantity !== undefined) updatePayload.quantity = fields.quantity;
  if (fields.isActive !== undefined) updatePayload.is_active = fields.isActive;

  if (Object.keys(updatePayload).length > 0) {
    await updateBundleRepo(config, id, updatePayload);
  }

  if (fields.items) {
    await replaceBundleItemsRepo(
      config,
      id,
      fields.items.map((item) => ({
        product_id: item.productId,
        units_per_person: item.unitsPerPerson,
      })),
    );
  }

  return { ok: true as const };
}

export async function softDeleteBundleService(
  config: SupabaseConfig,
  id: string,
) {
  const existing = await getBundleByIdRepo(config, id);
  if (!existing) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  await softDeleteBundleRepo(config, id);
  return { ok: true as const };
}
