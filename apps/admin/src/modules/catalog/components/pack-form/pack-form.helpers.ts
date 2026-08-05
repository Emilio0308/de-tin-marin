import { computePackReference } from "@de-tin-marin/shared/pack-price";
import {
  computeFinalPrice,
  toCampaignForPricing,
} from "@de-tin-marin/shared/final-price";
import {
  CATALOG_IMAGE_CONTENT_TYPES,
  CATALOG_IMAGE_MAX_BYTES,
} from "@/modules/media/schemas/presign-catalog-image.schema";
import type { PackFormDTO } from "@/modules/catalog/types/pack.dto";
import type {
  CampaignOption,
  PackFormItemValues,
  PackFormValues,
  ProductOption,
} from "./pack-form.types";

export function mergePackProductOptions(
  fromQuery: ProductOption[],
  initial?: PackFormDTO,
): ProductOption[] {
  const byId = new Map(fromQuery.map((product) => [product.id, product]));

  for (const item of initial?.items ?? []) {
    if (!byId.has(item.productId)) {
      byId.set(item.productId, {
        id: item.productId,
        name: item.productName,
        packageNetPrice: item.packageNetPrice,
        unitNetPrice: item.unitNetPrice,
      });
    }
  }

  return [...byId.values()];
}

export function buildDefaultPackValues(initial?: PackFormDTO): PackFormValues {
  return {
    sku: initial?.sku ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    slug: initial?.slug ?? "",
    imageUrl: initial?.imageUrl ?? "",
    normalNetPrice: initial?.normalNetPrice ?? 0,
    campaignId: initial?.campaignId ?? "",
    purchaseMinQuantity: initial?.purchaseMinQuantity ?? 1,
    purchaseMaxQuantity: initial?.purchaseMaxQuantity ?? 100,
    isActive: initial?.isActive ?? true,
    items:
      initial?.items.map((item) => ({
        productId: item.productId,
        packageQuantity: item.packageQuantity,
        unitQuantity: item.unitQuantity,
      })) ?? [],
  };
}

export function computeLiveReference(
  values: Pick<PackFormValues, "items">,
  products: ProductOption[],
): number {
  const byId = new Map(products.map((product) => [product.id, product]));

  return computePackReference(
    values.items.map((item) => {
      const product = byId.get(item.productId);
      return {
        packageNetPrice: product?.packageNetPrice ?? 0,
        unitNetPrice: product?.unitNetPrice ?? 0,
        packageQuantity: item.packageQuantity,
        unitQuantity: item.unitQuantity,
      };
    }),
  ).referenceNetPrice;
}

export function computeLiveFinalPrice(
  normalNetPrice: number,
  campaignId: string,
  campaigns: CampaignOption[],
): number {
  const campaign = campaigns.find((item) => item.id === campaignId);
  if (!campaign) return normalNetPrice;

  return computeFinalPrice(
    normalNetPrice,
    toCampaignForPricing({
      percentage: campaign.percentage,
      starts_at: campaign.startsAt,
      ends_at: campaign.endsAt,
      is_active: campaign.isActive,
    }),
  );
}

export function addPackItem(
  items: PackFormItemValues[],
  productId: string,
): PackFormItemValues[] {
  if (!productId || items.some((item) => item.productId === productId)) {
    return items;
  }

  return [...items, { productId, packageQuantity: 1, unitQuantity: 0 }];
}

export function removePackItem(
  items: PackFormItemValues[],
  productId: string,
): PackFormItemValues[] {
  return items.filter((item) => item.productId !== productId);
}

function clampNonNegative(value: number): number {
  return Math.max(0, Math.floor(value));
}

/** Ensures packageQuantity + unitQuantity >= 1 after a change. */
export function setPackItemPackageQuantity(
  items: PackFormItemValues[],
  productId: string,
  packageQuantity: number,
): PackFormItemValues[] {
  const nextPkg = clampNonNegative(packageQuantity);
  return items.map((item) => {
    if (item.productId !== productId) return item;
    const unitQuantity = clampNonNegative(item.unitQuantity);
    if (nextPkg + unitQuantity < 1) {
      return { ...item, packageQuantity: 0, unitQuantity: 1 };
    }
    return { ...item, packageQuantity: nextPkg, unitQuantity };
  });
}

export function setPackItemUnitQuantity(
  items: PackFormItemValues[],
  productId: string,
  unitQuantity: number,
): PackFormItemValues[] {
  const nextUnits = clampNonNegative(unitQuantity);
  return items.map((item) => {
    if (item.productId !== productId) return item;
    const packageQuantity = clampNonNegative(item.packageQuantity);
    if (packageQuantity + nextUnits < 1) {
      return { ...item, packageQuantity: 1, unitQuantity: 0 };
    }
    return { ...item, packageQuantity, unitQuantity: nextUnits };
  });
}

export function isValidImageUrl(value: string): boolean {
  if (!value.trim()) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "blob:"
    );
  } catch {
    return false;
  }
}

export function isAllowedCatalogImageFile(file: File): boolean {
  return (
    (CATALOG_IMAGE_CONTENT_TYPES as readonly string[]).includes(file.type) &&
    file.size > 0 &&
    file.size <= CATALOG_IMAGE_MAX_BYTES
  );
}

/** @deprecated Use isAllowedCatalogImageFile */
export const isAllowedPackImageFile = isAllowedCatalogImageFile;

export function canSubmitPackForm(values: PackFormValues): boolean {
  return (
    values.sku.trim().length > 0 &&
    values.name.trim().length > 0 &&
    values.items.length > 0 &&
    values.items.every(
      (item) => item.packageQuantity + item.unitQuantity >= 1,
    ) &&
    values.normalNetPrice >= 0 &&
    values.purchaseMaxQuantity >= values.purchaseMinQuantity
  );
}

export function resolvePackImageUrlForPersist(
  imageUrl: string,
  pendingImage: File | null,
  uploadedPublicUrl: string | null,
): string | null {
  if (pendingImage) {
    return uploadedPublicUrl;
  }
  const trimmed = imageUrl.trim();
  if (!trimmed || trimmed.startsWith("blob:")) return null;
  return trimmed;
}
