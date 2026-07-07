"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { listPublicCategoriesAction } from "@/modules/catalog/actions/list-public-categories";
import { listPublicProductsAction } from "@/modules/catalog/actions/list-public-products";
import {
  buildCatalogSearchParams,
  catalogSortOptions,
  readProductListQuery,
} from "@/modules/catalog/helpers/catalog-url";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { queryKeys } from "@/shared/query/query-keys";
import type { PublicCatalogSort } from "@de-tin-marin/validations/public-catalog";
import { ProductsPage } from "./products-page";

export function ProductsPageContainer() {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const { addProduct } = useCart();
  const [searchDraft, setSearchDraft] = useState(
    () => searchParams.get("search") ?? "",
  );

  const query = useMemo(
    () => readProductListQuery(searchParams),
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
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.catalog.productsList(query),
    queryFn: async () => {
      const result = await listPublicProductsAction(query);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  function pushParams(updates: Record<string, string | undefined>) {
    const params = buildCatalogSearchParams(searchParams, updates);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const currentPage = productsQuery.data?.page ?? query.page;
  const totalPages = Math.max(
    1,
    Math.ceil(
      (productsQuery.data?.total ?? 0) /
        (productsQuery.data?.pageSize ?? query.pageSize),
    ),
  );

  return (
    <StorefrontLayout>
      <ProductsPage
        title={t("products.title")}
        subtitle={t("products.subtitle")}
        categoriesTitle={t("filters.categories")}
        allCategoriesLabel={t("filters.allCategories")}
        categories={categoriesQuery.data ?? []}
        activeCategoryId={query.categoryId}
        products={productsQuery.data?.items ?? []}
        page={productsQuery.data?.page ?? query.page}
        pageSize={productsQuery.data?.pageSize ?? query.pageSize}
        total={productsQuery.data?.total ?? 0}
        searchValue={searchDraft}
        sortValue={query.sort}
        sortOptions={sortOptions}
        labels={{
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
            page: currentPage,
            total: totalPages,
          }),
        }}
        isLoading={productsQuery.isLoading}
        isError={productsQuery.isError}
        onRetry={() => void productsQuery.refetch()}
        onCategoryChange={(categoryId) => pushParams({ categoryId, page: "1" })}
        onSearchChange={setSearchDraft}
        onSearchSubmit={() => pushParams({ search: searchDraft, page: "1" })}
        onSortChange={(sort: PublicCatalogSort) =>
          pushParams({ sort, page: "1" })
        }
        onPageChange={(page) => pushParams({ page: String(page) })}
        onAddProduct={addProduct}
      />
    </StorefrontLayout>
  );
}
