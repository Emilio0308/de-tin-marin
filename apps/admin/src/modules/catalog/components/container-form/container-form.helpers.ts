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
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
