"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { listPublicCategoriesAction } from "@/modules/catalog/actions/list-public-categories";
import { listPublicProductsAction } from "@/modules/catalog/actions/list-public-products";
import { listPublicBundlesAction } from "@/modules/catalog/actions/list-public-bundles";
import {
  catalogSortOptions,
  readBundleListQuery,
  readProductListQuery,
} from "@/modules/catalog/helpers/catalog-url";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import {
  buildStorefrontSearchParams,
  readStorefrontTab,
  type StorefrontTab,
} from "@/modules/home/helpers/storefront-url";
import { queryKeys } from "@/shared/query/query-keys";
import type { PublicCatalogSort } from "@de-tin-marin/validations/public-catalog";
import { StorefrontPage } from "./storefront-page";

export function StorefrontPageContainer() {
  const t = useTranslations("catalog");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const { addProduct } = useCart();

  const tab = readStorefrontTab(searchParams);

  const [productsSearchDraft, setProductsSearchDraft] = useState(
    () => searchParams.get("search") ?? "",
  );
  const [bundlesSearchDraft, setBundlesSearchDraft] = useState(
    () => searchParams.get("search") ?? "",
  );

  const productQuery = useMemo(
    () => readProductListQuery(searchParams),
    [searchParams],
  );
  const bundleQuery = useMemo(
    () => readBundleListQuery(searchParams),
    [searchParams],
  );

  const sortOptions = useMemo(
    () =>
      catalogSortOptions({
        nameAsc: t("sort.nameAsc"),
        nameDesc: t("sort.nameDesc"),
        priceAsc: t("sort.priceAsc"),
        priceDesc: t("sort.priceDesc"),
      }),
    [t],
  );

  const categoriesQuery = useQuery({
    queryKey: queryKeys.catalog.categories(),
    queryFn: async () => {
      const result = await listPublicCategoriesAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: tab === "productos",
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.catalog.productsList(productQuery),
    queryFn: async () => {
      const result = await listPublicProductsAction(productQuery);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: tab === "productos",
  });

  const bundlesQuery = useQuery({
    queryKey: queryKeys.catalog.bundlesList(bundleQuery),
    queryFn: async () => {
      const result = await listPublicBundlesAction(bundleQuery);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: tab === "sorpresas",
  });

  function pushParams(updates: Record<string, string | undefined>) {
    const params = buildStorefrontSearchParams(searchParams, updates);
    startTransition(() => {
      router.push(`/?${params.toString()}`, { scroll: false });
    });
  }

  function handleTabChange(nextTab: StorefrontTab) {
    if (nextTab === tab) return;
    startTransition(() => {
      router.push(`/?tab=${nextTab}`, { scroll: false });
    });
  }

  const productsCurrentPage = productsQuery.data?.page ?? productQuery.page;
  const productsTotalPages = Math.max(
    1,
    Math.ceil(
      (productsQuery.data?.total ?? 0) /
        (productsQuery.data?.pageSize ?? productQuery.pageSize),
    ),
  );

  const bundlesCurrentPage = bundlesQuery.data?.page ?? bundleQuery.page;
  const bundlesTotalPages = Math.max(
    1,
    Math.ceil(
      (bundlesQuery.data?.total ?? 0) /
        (bundlesQuery.data?.pageSize ?? bundleQuery.pageSize),
    ),
  );

  return (
    <StorefrontLayout>
      <StorefrontPage
        tab={tab}
        tabLabels={{
          products: tNav("sweets"),
          bundles: tNav("surprises"),
        }}
        onTabChange={handleTabChange}
        products={{
          categoriesTitle: t("filters.categories"),
          allCategoriesLabel: t("filters.allCategories"),
          categories: categoriesQuery.data ?? [],
          activeCategoryId: productQuery.categoryId,
          products: productsQuery.data?.items ?? [],
          page: productsQuery.data?.page ?? productQuery.page,
          pageSize: productsQuery.data?.pageSize ?? productQuery.pageSize,
          total: productsQuery.data?.total ?? 0,
          searchValue: productsSearchDraft,
          sortValue: productQuery.sort,
          sortOptions,
          labels: {
            searchPlaceholder: t("filters.searchProducts"),
            searchAriaLabel: t("filters.searchProducts"),
            sortLabel: t("filters.sort"),
            addToCart: t("actions.addToCart"),
            stockLabel: t("products.stock"),
            empty: t("products.empty"),
            loading: tCommon("loading"),
            error: tCommon("error"),
            retry: tCommon("retry"),
            previous: t("pagination.previous"),
            next: t("pagination.next"),
            page: t("pagination.page", {
              page: productsCurrentPage,
              total: productsTotalPages,
            }),
          },
          isLoading: productsQuery.isLoading,
          isError: productsQuery.isError,
          onRetry: () => void productsQuery.refetch(),
          onCategoryChange: (categoryId) =>
            pushParams({ categoryId, page: "1" }),
          onSearchChange: setProductsSearchDraft,
          onSearchSubmit: () =>
            pushParams({ search: productsSearchDraft, page: "1" }),
          onSortChange: (sort: PublicCatalogSort) =>
            pushParams({ sort, page: "1" }),
          onPageChange: (page) => pushParams({ page: String(page) }),
          onAddProduct: addProduct,
        }}
        bundles={{
          bundles: bundlesQuery.data?.items ?? [],
          page: bundlesQuery.data?.page ?? bundleQuery.page,
          pageSize: bundlesQuery.data?.pageSize ?? bundleQuery.pageSize,
          total: bundlesQuery.data?.total ?? 0,
          searchValue: bundlesSearchDraft,
          sortValue: bundleQuery.sort,
          sortOptions,
          labels: {
            searchPlaceholder: t("filters.searchBundles"),
            searchAriaLabel: t("filters.searchBundles"),
            sortLabel: t("filters.sort"),
            personalize: t("actions.personalize"),
            price: t("actions.price"),
            empty: t("bundles.empty"),
            loading: tCommon("loading"),
            error: tCommon("error"),
            retry: tCommon("retry"),
            previous: t("pagination.previous"),
            next: t("pagination.next"),
            page: t("pagination.page", {
              page: bundlesCurrentPage,
              total: bundlesTotalPages,
            }),
          },
          isLoading: bundlesQuery.isLoading,
          isError: bundlesQuery.isError,
          onRetry: () => void bundlesQuery.refetch(),
          onSearchChange: setBundlesSearchDraft,
          onSearchSubmit: () =>
            pushParams({ search: bundlesSearchDraft, page: "1" }),
          onSortChange: (sort: PublicCatalogSort) =>
            pushParams({ sort, page: "1" }),
          onPageChange: (page) => pushParams({ page: String(page) }),
        }}
      />
    </StorefrontLayout>
  );
}
