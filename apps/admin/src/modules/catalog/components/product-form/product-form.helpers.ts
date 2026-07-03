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
