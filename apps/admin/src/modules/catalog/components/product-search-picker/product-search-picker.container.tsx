"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ProductListItem } from "@de-tin-marin/validations/product";
import { ADMIN_DEFAULT_PAGE_SIZE } from "@de-tin-marin/validations/admin-list";
import { listProductsPageAction } from "@/modules/catalog/actions/list-products";
import { queryKeys } from "@/shared/query/query-keys";
import { ProductSearchPicker } from "./product-search-picker";
import type {
  ProductSearchPickerItem,
  ProductSearchPickerLabels,
} from "./product-search-picker.types";

const PAGE_SIZE = ADMIN_DEFAULT_PAGE_SIZE;
const DEBOUNCE_MS = 300;

function toPickerItem(product: ProductListItem): ProductSearchPickerItem {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    netPrice: product.netPrice,
    unitNetPrice: product.unitNetPrice,
    finalPrice: product.finalPrice,
    finalUnitPrice: product.finalUnitPrice,
    imageUrl: product.imageUrl,
    productType: product.productType,
    itemsPerPackage: product.itemsPerPackage,
    stockTotalBaseUnits: product.stockTotalBaseUnits,
    purchaseMinQuantity: product.purchaseMinQuantity,
    purchaseMaxQuantity: product.purchaseMaxQuantity,
  };
}

export type ProductSearchPickerContainerProps = {
  status?: "all" | "active" | "inactive";
  excludeIds?: string[];
  onSelect: (item: ProductSearchPickerItem) => void;
  formatPrice?: (price: number) => string;
  labels?: Partial<ProductSearchPickerLabels>;
};

export function ProductSearchPickerContainer({
  status = "active",
  excludeIds = [],
  onSelect,
  formatPrice,
  labels: labelOverrides,
}: ProductSearchPickerContainerProps) {
  const t = useTranslations("productSearchPicker");
  const [searchDraft, setSearchDraft] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<ProductSearchPickerItem[]>([]);
  const [knownTotal, setKnownTotal] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchDraft.trim());
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    setPage(1);
    setAccumulated([]);
    setKnownTotal(0);
  }, [debouncedSearch, status]);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status,
    }),
    [page, debouncedSearch, status],
  );

  const productsQuery = useQuery({
    queryKey: queryKeys.catalog.productsPage(listQuery),
    queryFn: async () => {
      const result = await listProductsPageAction(listQuery);
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
  });

  useEffect(() => {
    if (!productsQuery.data) return;
    if (productsQuery.data.page !== page) return;
    const mapped = productsQuery.data.items.map(toPickerItem);
    setKnownTotal(productsQuery.data.total);
    setAccumulated((current) => {
      if (page === 1) return mapped;
      const seen = new Set(current.map((item) => item.id));
      return [...current, ...mapped.filter((item) => !seen.has(item.id))];
    });
  }, [productsQuery.data, page]);

  const canLoadMore = accumulated.length < knownTotal;
  const exclude = useMemo(() => new Set(excludeIds), [excludeIds]);
  const visibleCount = accumulated.filter(
    (item) => !exclude.has(item.id),
  ).length;

  // Si la página quedó vacía por excludeIds, pedir la siguiente automáticamente.
  useEffect(() => {
    if (!canLoadMore || productsQuery.isFetching) return;
    if (visibleCount > 0) return;
    if (knownTotal === 0) return;
    setPage((current) => current + 1);
  }, [canLoadMore, productsQuery.isFetching, visibleCount, knownTotal]);

  const handleLoadMore = useCallback(() => {
    setPage((current) => current + 1);
  }, []);

  const labels: ProductSearchPickerLabels = {
    searchPlaceholder:
      labelOverrides?.searchPlaceholder ?? t("searchPlaceholder"),
    searchAriaLabel: labelOverrides?.searchAriaLabel ?? t("searchAriaLabel"),
    empty: labelOverrides?.empty ?? t("empty"),
    loading: labelOverrides?.loading ?? t("loading"),
    loadMore: labelOverrides?.loadMore ?? t("loadMore"),
    noMore: labelOverrides?.noMore ?? t("noMore"),
    formatUnitPrice:
      labelOverrides?.formatUnitPrice ??
      ((price) => t("formatUnitPrice", { price })),
    formatItemsPerPackage:
      labelOverrides?.formatItemsPerPackage ??
      ((count) => t("formatItemsPerPackage", { count })),
  };

  return (
    <ProductSearchPicker
      items={accumulated}
      excludeIds={excludeIds}
      searchValue={searchDraft}
      isLoading={productsQuery.isLoading || productsQuery.isFetching}
      isError={productsQuery.isError}
      canLoadMore={canLoadMore && !productsQuery.isFetching}
      labels={labels}
      onSearchChange={setSearchDraft}
      onSelect={onSelect}
      onLoadMore={handleLoadMore}
      formatPrice={formatPrice}
    />
  );
}
