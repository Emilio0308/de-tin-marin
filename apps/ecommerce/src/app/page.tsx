import { Suspense } from "react";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { supabaseConfig } from "@/config/env";
import { StorefrontPageContainer } from "@/modules/home/components/storefront-page/storefront-page.container";
import {
  loadStorefrontCatalog,
  searchParamsRecordToURLSearchParams,
} from "@/modules/home/services/load-storefront-catalog";
import { CATALOG_QUERY_CACHE_MS } from "@/shared/query/query-cache";
import { queryKeys } from "@/shared/query/query-keys";

type HomeRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomeRoute({ searchParams }: HomeRouteProps) {
  const rawParams = await searchParams;
  const params = searchParamsRecordToURLSearchParams(rawParams);
  const payload = await loadStorefrontCatalog(supabaseConfig, params);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: CATALOG_QUERY_CACHE_MS,
        gcTime: CATALOG_QUERY_CACHE_MS,
      },
    },
  });

  queryClient.setQueryData(queryKeys.catalog.version(), payload.versionAt);
  queryClient.setQueryData(queryKeys.home.hero(), payload.hero);

  if (payload.categories) {
    queryClient.setQueryData(
      queryKeys.catalog.categories(),
      payload.categories,
    );
  }
  if (payload.products) {
    queryClient.setQueryData(
      queryKeys.catalog.productsList(payload.productQuery),
      payload.products,
    );
  }
  if (payload.bundles) {
    queryClient.setQueryData(
      queryKeys.catalog.bundlesList(payload.bundleQuery),
      payload.bundles,
    );
  }
  if (payload.packs) {
    queryClient.setQueryData(
      queryKeys.catalog.packsList(payload.packQuery),
      payload.packs,
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <StorefrontPageContainer />
      </Suspense>
    </HydrationBoundary>
  );
}
