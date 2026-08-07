import { Suspense } from "react";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { supabaseConfig } from "@/config/env";
import { ProductListContainer } from "@/modules/catalog/components/product-list/product-list.container";
import { listCategoriesService } from "@/modules/catalog/services/category.service";
import { listProductsPageService } from "@/modules/catalog/services/product.service";
import { requireStaff } from "@/shared/auth/require-staff";
import { readAdminProductListQuery } from "@/shared/helpers/admin-list-url";
import { searchParamsRecordToURLSearchParams } from "@/shared/helpers/search-params";
import { createAdminQueryClient } from "@/shared/query/create-admin-query-client";
import { queryKeys } from "@/shared/query/query-keys";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) redirect("/login");

  const params = searchParamsRecordToURLSearchParams(await searchParams);
  const listQuery = readAdminProductListQuery(params);

  const [productsResult, categories] = await Promise.all([
    listProductsPageService(supabaseConfig, listQuery),
    listCategoriesService(supabaseConfig),
  ]);

  const queryClient = createAdminQueryClient();
  queryClient.setQueryData(queryKeys.catalog.categories(), categories);
  if (productsResult.ok) {
    queryClient.setQueryData(
      queryKeys.catalog.productsPage(listQuery),
      productsResult.data,
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <ProductListContainer />
      </Suspense>
    </HydrationBoundary>
  );
}
