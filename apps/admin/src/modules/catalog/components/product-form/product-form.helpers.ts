import { roundMoney } from "@de-tin-marin/shared/prices";
import type { ProductFormDTO } from "@/modules/catalog/types/product.dto";
import type { ProductFormValues } from "./product-form.types";

const DEFAULT_PACKAGE_ITEMS = 10;

export function buildDefaultProductValues(): ProductFormValues {
  return {
    sku: "",
    name: "",
    description: "",
    slug: "",
    brand: "",
    productType: "unit",
    itemsPerPackage: 1,
    packageLabel: "",
    packageNetPrice: 0,
    stockSealedPackages: 0,
    stockLooseBaseUnits: 0,
    purchaseMinQuantity: 10,
    purchaseMaxQuantity: 100,
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
    productType: initial.productType,
    itemsPerPackage: initial.itemsPerPackage,
    packageLabel: initial.packageLabel ?? "",
    packageNetPrice: initial.packageNetPrice,
    stockSealedPackages: initial.stockSealedPackages,
    stockLooseBaseUnits: initial.stockLooseBaseUnits,
    purchaseMinQuantity: initial.purchaseMinQuantity,
    purchaseMaxQuantity: initial.purchaseMaxQuantity,
    categoryId: initial.categoryId,
    imageUrl: initial.imageUrl ?? "",
    isActive: initial.isActive,
  };
}

export function applyProductTypeChange(
  prev: ProductFormValues,
  productType: "unit" | "package",
): ProductFormValues {
  if (productType === "unit") {
    const previousItems = Math.max(1, prev.itemsPerPackage);
    const unitPrice = roundMoney(prev.packageNetPrice / previousItems);
    const totalStock =
      prev.stockLooseBaseUnits + prev.stockSealedPackages * previousItems;

    return {
      ...prev,
      productType: "unit",
      itemsPerPackage: 1,
      packageLabel: "",
      packageNetPrice: unitPrice,
      stockSealedPackages: 0,
      stockLooseBaseUnits: totalStock,
    };
  }

  const nextItems =
    prev.itemsPerPackage > 1 ? prev.itemsPerPackage : DEFAULT_PACKAGE_ITEMS;
  const unitPrice = roundMoney(
    prev.packageNetPrice / Math.max(1, prev.itemsPerPackage),
  );
  const packagePrice = roundMoney(unitPrice * nextItems);
  const totalStock =
    prev.stockLooseBaseUnits +
    prev.stockSealedPackages * Math.max(1, prev.itemsPerPackage);
  const sealed = Math.floor(totalStock / nextItems);
  const loose = totalStock % nextItems;

  return {
    ...prev,
    productType: "package",
    itemsPerPackage: nextItems,
    packageLabel: prev.packageLabel || "paquete",
    packageNetPrice: packagePrice,
    stockSealedPackages: sealed,
    stockLooseBaseUnits: loose,
  };
}

export function computeUnitNetPricePreview(
  packageNetPrice: number,
  itemsPerPackage: number,
): number {
  const safeItems = Math.max(1, Math.floor(itemsPerPackage));
  return roundMoney(packageNetPrice / safeItems);
}

export function computeStockTotalPreview(
  sealedPackages: number,
  looseBaseUnits: number,
  itemsPerPackage: number,
): number {
  const safeItems = Math.max(1, Math.floor(itemsPerPackage));
  return sealedPackages * safeItems + looseBaseUnits;
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
