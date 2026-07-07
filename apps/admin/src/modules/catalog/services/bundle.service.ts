import "server-only";

import {
  createBundleInputSchema,
  updateBundleInputSchema,
} from "@de-tin-marin/validations/bundle";
import { computeBundleTotal } from "@de-tin-marin/shared/bundle-price";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { parsePricesJson } from "../repositories/product.repository";
import {
  getActiveContainersByIdsRepo,
  getSurpriseContainerByIdRepo,
  parseContainerPricesJson,
} from "../repositories/surprise-container.repository";
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
import type { BundleFormDTO, BundleFormItemDTO } from "../types/bundle.dto";
import type { BundleListItem } from "@de-tin-marin/validations/bundle";

function normalizeImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || imageUrl.trim() === "") return null;
  return imageUrl;
}

function toPriceItems(items: BundleItemWithProduct[]) {
  return items.map((item) => ({
    unitNetPrice: parsePricesJson(item.products?.prices ?? {}).unitNetPrice,
    unitsPerPerson: item.units_per_person,
  }));
}

function toFormItemDTO(item: BundleItemWithProduct): BundleFormItemDTO {
  return {
    productId: item.product_id,
    productName: item.products?.name ?? "—",
    unitNetPrice: parsePricesJson(item.products?.prices ?? {}).unitNetPrice,
    unitsPerPerson: item.units_per_person,
  };
}

function getContainerNetPrice(
  row: BundleRow,
  containersById: Map<string, { netPrice: number; name: string; sku: string }>,
): number {
  const container = containersById.get(row.container_id);
  return container?.netPrice ?? 0;
}

function toListItem(
  row: BundleRow,
  items: BundleItemWithProduct[],
  containersById: Map<string, { netPrice: number; name: string; sku: string }>,
): BundleListItem {
  const container = containersById.get(row.container_id);
  const containerNetPrice = container?.netPrice ?? 0;
  const { total } = computeBundleTotal({
    containerNetPrice,
    quantity: row.quantity,
    items: toPriceItems(items),
  });

  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    containerId: row.container_id,
    containerName: container?.name ?? "—",
    containerNetPrice,
    quantity: row.quantity,
    itemCount: items.length,
    total,
    isActive: row.is_active,
  };
}

function toFormDTO(
  row: BundleRow,
  items: BundleItemWithProduct[],
  container: { id: string; sku: string; name: string; netPrice: number },
): BundleFormDTO {
  const { itemsSubtotal, containerSubtotal, total } = computeBundleTotal({
    containerNetPrice: container.netPrice,
    quantity: row.quantity,
    items: toPriceItems(items),
  });

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    containerId: container.id,
    containerName: container.name,
    containerNetPrice: container.netPrice,
    quantity: row.quantity,
    isActive: row.is_active,
    items: items.map(toFormItemDTO),
    itemsSubtotal,
    containerSubtotal,
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

async function validateContainer(config: SupabaseConfig, containerId: string) {
  const container = await getSurpriseContainerByIdRepo(config, containerId);
  if (!container || !container.is_active) {
    return { ok: false as const, error: "CONTAINER_NOT_FOUND" as const };
  }
  return { ok: true as const };
}

async function buildContainersMap(
  config: SupabaseConfig,
  containerIds: string[],
) {
  const containers = await getActiveContainersByIdsRepo(config, containerIds);
  return new Map(
    containers.map((container) => [
      container.id,
      {
        netPrice: parseContainerPricesJson(container.prices).netPrice,
        name: container.name,
        sku: container.sku,
      },
    ]),
  );
}

export async function listBundlesService(
  config: SupabaseConfig,
): Promise<BundleListItem[]> {
  const rows = await listBundlesRepo(config);
  if (rows.length === 0) return [];

  const containerIds = [...new Set(rows.map((row) => row.container_id))];
  const containersById = await buildContainersMap(config, containerIds);

  const bundleIds = rows.map((row) => row.id);
  const allItems = await listBundleItemsByBundleIdsRepo(config, bundleIds);

  const itemsByBundle = new Map<string, BundleItemWithProduct[]>();
  for (const item of allItems) {
    const list = itemsByBundle.get(item.bundle_id) ?? [];
    list.push(item);
    itemsByBundle.set(item.bundle_id, list);
  }

  return rows.map((row) =>
    toListItem(row, itemsByBundle.get(row.id) ?? [], containersById),
  );
}

export async function getBundleService(
  config: SupabaseConfig,
  id: string,
): Promise<BundleFormDTO | null> {
  const row = await getBundleByIdRepo(config, id);
  if (!row) return null;

  const containerRow = row.surprise_containers;
  if (!containerRow) return null;

  const container = {
    id: containerRow.id,
    sku: containerRow.sku,
    name: containerRow.name,
    netPrice: parseContainerPricesJson(containerRow.prices).netPrice,
  };

  return toFormDTO(row, row.bundle_items ?? [], container);
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

  const containerCheck = await validateContainer(config, data.containerId);
  if (!containerCheck.ok) {
    return { ok: false as const, error: containerCheck.error };
  }

  const row = await insertBundleRepo(config, {
    name: data.name,
    description: data.description ?? null,
    image_url: normalizeImageUrl(data.imageUrl),
    container_id: data.containerId,
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

  if (fields.containerId) {
    const containerCheck = await validateContainer(config, fields.containerId);
    if (!containerCheck.ok) {
      return { ok: false as const, error: containerCheck.error };
    }
  }

  const updatePayload: Parameters<typeof updateBundleRepo>[2] = {};

  if (fields.name !== undefined) updatePayload.name = fields.name;
  if (fields.description !== undefined)
    updatePayload.description = fields.description ?? null;
  if (fields.imageUrl !== undefined)
    updatePayload.image_url = normalizeImageUrl(fields.imageUrl);
  if (fields.containerId !== undefined)
    updatePayload.container_id = fields.containerId;
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

export { getContainerNetPrice };
