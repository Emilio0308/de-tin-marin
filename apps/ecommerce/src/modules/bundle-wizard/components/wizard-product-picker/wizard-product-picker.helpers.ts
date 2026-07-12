import type { PublicProductListItem } from "@de-tin-marin/validations/public-catalog";

export type ProductPickerPage = {
  items: PublicProductListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export function flattenProductPickerPages(
  pages: ProductPickerPage[] | undefined,
): PublicProductListItem[] {
  return pages?.flatMap((page) => page.items) ?? [];
}

export function getNextProductPickerPage(
  lastPage: ProductPickerPage,
): number | undefined {
  const loadedCount = lastPage.page * lastPage.pageSize;
  if (loadedCount >= lastPage.total) return undefined;
  return lastPage.page + 1;
}

/**
 * Whether to show the prices in the product picker.
 *
 * This is a temporary flag to hide the prices in the product picker.
 * It will be removed once we have a proper pricing system.
 */
export const SHOWN_PRICES = false;
