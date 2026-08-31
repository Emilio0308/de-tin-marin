"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
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
const DEBOUNCE_MS = 450;
const MAX_AUTO_PAGE_ADVANCES = 3;

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
  const autoPageAdvancesRef = useRef(0);

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
    autoPageAdvancesRef.current = 0;
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

  const searchSettled =
    debouncedSearch === searchDraft.trim() ||
    (searchDraft.trim() === "" && debouncedSearch === "");

  const productsQuery = useQuery({
    queryKey: queryKeys.catalog.productsPage(listQuery),
    queryFn: async () => {
      const result = await listProductsPageAction(listQuery);
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
    enabled: searchSettled,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!productsQuery.data) return;
    const responsePage = productsQuery.data.page;
    if (responsePage !== page && responsePage === 1 && page > 1) {
      setPage(1);
    }
    const mapped = productsQuery.data.items.map(toPickerItem);
    setKnownTotal(productsQuery.data.total);
    setAccumulated((current) => {
      if (responsePage === 1) return mapped;
      const seen = new Set(current.map((item) => item.id));
      return [...current, ...mapped.filter((item) => !seen.has(item.id))];
    });
  }, [productsQuery.data, page]);

  const canLoadMore = accumulated.length < knownTotal;
  const exclude = useMemo(() => new Set(excludeIds), [excludeIds]);
  const visibleCount = accumulated.filter(
    (item) => !exclude.has(item.id),
  ).length;

  // Si la página quedó vacía por excludeIds, pedir la siguiente (máx. N veces).
  useEffect(() => {
    if (!canLoadMore || productsQuery.isFetching) return;
    if (visibleCount > 0) return;
    if (knownTotal === 0) return;
    if (autoPageAdvancesRef.current >= MAX_AUTO_PAGE_ADVANCES) return;
    autoPageAdvancesRef.current += 1;
    setPage((current) => current + 1);
  }, [canLoadMore, productsQuery.isFetching, visibleCount, knownTotal]);

  const handleLoadMore = useCallback(() => {
    if (productsQuery.isFetching) return;
    setPage((current) => current + 1);
  }, [productsQuery.isFetching]);

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
