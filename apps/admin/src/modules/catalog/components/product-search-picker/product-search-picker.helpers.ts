import type { ProductSearchPickerItem } from "./product-search-picker.types";

export function shouldShowItemsPerPackage(
  item: Pick<ProductSearchPickerItem, "productType" | "itemsPerPackage">,
): boolean {
  return item.productType === "package" || item.itemsPerPackage > 1;
}
