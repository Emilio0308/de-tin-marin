"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { listPublicBundlesAction } from "@/modules/catalog/actions/list-public-bundles";
import {
  buildCatalogSearchParams,
  catalogSortOptions,
  readBundleListQuery,
} from "@/modules/catalog/helpers/catalog-url";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { queryKeys } from "@/shared/query/query-keys";
import type { PublicCatalogSort } from "@de-tin-marin/validations/public-catalog";
import { BundlesPage } from "./bundles-page";

export function BundlesPageContainer() {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchDraft, setSearchDraft] = useState(
    () => searchParams.get("search") ?? "",
  );

  const query = useMemo(
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

  const bundlesQuery = useQuery({
    queryKey: queryKeys.catalog.bundlesList(query),
    queryFn: async () => {
      const result = await listPublicBundlesAction(query);
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

  const currentPage = bundlesQuery.data?.page ?? query.page;
  const totalPages = Math.max(
    1,
    Math.ceil(
      (bundlesQuery.data?.total ?? 0) /
        (bundlesQuery.data?.pageSize ?? query.pageSize),
    ),
  );

  return (
    <StorefrontLayout>
      <BundlesPage
        title={t("bundles.title")}
        subtitle={t("bundles.subtitle")}
        bundles={bundlesQuery.data?.items ?? []}
        page={bundlesQuery.data?.page ?? query.page}
        pageSize={bundlesQuery.data?.pageSize ?? query.pageSize}
        total={bundlesQuery.data?.total ?? 0}
        searchValue={searchDraft}
        sortValue={query.sort}
        sortOptions={sortOptions}
        labels={{
          searchPlaceholder: t("filters.searchBundles"),
          searchAriaLabel: t("filters.searchBundles"),
          sortLabel: t("filters.sort"),
          personalize: t("actions.personalize"),
          empty: t("bundles.empty"),
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
        isLoading={bundlesQuery.isLoading}
        isError={bundlesQuery.isError}
        onRetry={() => void bundlesQuery.refetch()}
        onSearchChange={setSearchDraft}
        onSearchSubmit={() => pushParams({ search: searchDraft, page: "1" })}
        onSortChange={(sort: PublicCatalogSort) =>
          pushParams({ sort, page: "1" })
        }
        onPageChange={(page) => pushParams({ page: String(page) })}
      />
    </StorefrontLayout>
  );
}
