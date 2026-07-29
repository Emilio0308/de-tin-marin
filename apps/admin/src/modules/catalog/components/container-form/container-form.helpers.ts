import {
  CATALOG_IMAGE_CONTENT_TYPES,
  CATALOG_IMAGE_MAX_BYTES,
} from "@/modules/media/schemas/presign-catalog-image.schema";
import type { SurpriseContainerFormDTO } from "@/modules/catalog/types/surprise-container.dto";
import type { ContainerFormValues } from "./container-form.types";

export const CONTAINER_NAME_MAX = 200;
export const CONTAINER_DESCRIPTION_MAX = 5000;
export const LOW_STOCK_THRESHOLD = 20;

export function buildDefaultContainerValues(): ContainerFormValues {
  return {
    sku: "",
    name: "",
    description: "",
    imageUrl: "",
    netPrice: 0,
    stockQuantity: 0,
    isActive: true,
  };
}

export function buildInitialContainerValues(
  initial?: SurpriseContainerFormDTO,
): ContainerFormValues {
  if (!initial) return buildDefaultContainerValues();

  return {
    sku: initial.sku,
    name: initial.name,
    description: initial.description ?? "",
    imageUrl: initial.imageUrl ?? "",
    netPrice: initial.netPrice,
    stockQuantity: initial.stockQuantity,
    isActive: initial.isActive,
  };
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

export function resolveContainerImageUrlForPersist(
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

export function isLowStock(quantity: number): boolean {
  return quantity > 0 && quantity <= LOW_STOCK_THRESHOLD;
}

export function formatContainerPrice(value: number): string {
  return value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
