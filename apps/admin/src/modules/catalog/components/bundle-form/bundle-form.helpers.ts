import { computeBundleTotal } from "@de-tin-marin/shared/bundle-price";
import {
  BUNDLE_CUSTOMIZATION_DEFAULT_MAX,
  BUNDLE_CUSTOMIZATION_DEFAULT_MIN,
} from "@de-tin-marin/validations/customize-bundle";
import {
  CATALOG_IMAGE_CONTENT_TYPES,
  CATALOG_IMAGE_MAX_BYTES,
} from "@/modules/media/schemas/presign-catalog-image.schema";
import type { BundleFormDTO } from "@/modules/catalog/types/bundle.dto";
import type {
  BundleFormItemValues,
  BundleFormValues,
  ContainerOption,
  ProductOption,
} from "./bundle-form.types";

export function mergeBundleProductOptions(
  fromQuery: ProductOption[],
  initial?: BundleFormDTO,
): ProductOption[] {
  const byId = new Map(fromQuery.map((product) => [product.id, product]));

  for (const item of initial?.items ?? []) {
    if (!byId.has(item.productId)) {
      byId.set(item.productId, {
        id: item.productId,
        name: item.productName,
        unitNetPrice: item.unitNetPrice,
      });
    }
  }

  return [...byId.values()];
}

export function buildDefaultBundleValues(
  initial?: BundleFormDTO,
): BundleFormValues {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    imageUrl: initial?.imageUrl ?? "",
    containerId: initial?.containerId ?? "",
    quantity: initial?.quantity ?? 1,
    customizationMinProducts:
      initial?.customizationMinProducts ?? BUNDLE_CUSTOMIZATION_DEFAULT_MIN,
    customizationMaxProducts:
      initial?.customizationMaxProducts ?? BUNDLE_CUSTOMIZATION_DEFAULT_MAX,
    isActive: initial?.isActive ?? true,
    items:
      initial?.items.map((item) => ({
        productId: item.productId,
        unitsPerPerson: item.unitsPerPerson,
      })) ?? [],
  };
}

export function computeLiveTotal(
  values: Pick<BundleFormValues, "containerId" | "quantity" | "items">,
  products: ProductOption[],
  containers: ContainerOption[],
) {
  const priceById = new Map(
    products.map((product) => [product.id, product.unitNetPrice]),
  );
  const container = containers.find((item) => item.id === values.containerId);

  return computeBundleTotal({
    containerNetPrice: container?.netPrice ?? 0,
    quantity: values.quantity,
    items: values.items.map((item) => ({
      unitNetPrice: priceById.get(item.productId) ?? 0,
      unitsPerPerson: item.unitsPerPerson,
    })),
  });
}

export function addBundleItem(
  items: BundleFormItemValues[],
  productId: string,
): BundleFormItemValues[] {
  if (!productId || items.some((item) => item.productId === productId)) {
    return items;
  }

  return [...items, { productId, unitsPerPerson: 1 }];
}

export function removeBundleItem(
  items: BundleFormItemValues[],
  productId: string,
): BundleFormItemValues[] {
  return items.filter((item) => item.productId !== productId);
}

export function setBundleItemUnits(
  items: BundleFormItemValues[],
  productId: string,
  unitsPerPerson: number,
): BundleFormItemValues[] {
  const next = Math.max(1, Math.floor(unitsPerPerson));
  return items.map((item) =>
    item.productId === productId ? { ...item, unitsPerPerson: next } : item,
  );
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

export function resolveBundleImageUrlForPersist(
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

export function getSelectedContainerNetPrice(
  containerId: string,
  containers: ContainerOption[],
): number {
  return containers.find((item) => item.id === containerId)?.netPrice ?? 0;
}
