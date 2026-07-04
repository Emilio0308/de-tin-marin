import type { ProductFormDTO } from "@/modules/catalog/types/product.dto";
import type { ProductFormValues } from "./product-form.types";

export function buildDefaultProductValues(): ProductFormValues {
  return {
    sku: "",
    name: "",
    description: "",
    slug: "",
    brand: "",
    netPrice: 0,
    stockQuantity: 0,
    categoryId: "",
    imageUrl: "",
    isActive: true,
  };
}

export function buildInitialProductValues(
  initial?: ProductFormDTO,
): ProductFormValues {
  if (!initial) return buildDefaultProductValues();

  return {
    sku: initial.sku,
    name: initial.name,
    description: initial.description ?? "",
    slug: initial.slug,
    brand: initial.brand ?? "",
    netPrice: initial.netPrice,
    stockQuantity: initial.stockQuantity,
    categoryId: initial.categoryId,
    imageUrl: initial.imageUrl ?? "",
    isActive: initial.isActive,
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
