import { Suspense } from "react";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { supabaseConfig } from "@/config/env";
import { CategoryListContainer } from "@/modules/catalog/components/category-list/category-list.container";
import { listCategoriesPageService } from "@/modules/catalog/services/category.service";
import { requireStaff } from "@/shared/auth/require-staff";
import { readAdminCategoryListQuery } from "@/shared/helpers/admin-list-url";
import { searchParamsRecordToURLSearchParams } from "@/shared/helpers/search-params";
import { createAdminQueryClient } from "@/shared/query/create-admin-query-client";
import { queryKeys } from "@/shared/query/query-keys";

type CategoriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) redirect("/login");

  const params = searchParamsRecordToURLSearchParams(await searchParams);
  const listQuery = readAdminCategoryListQuery(params);
  const categoriesResult = await listCategoriesPageService(
    supabaseConfig,
    listQuery,
  );

  const queryClient = createAdminQueryClient();
  if (categoriesResult.ok) {
    queryClient.setQueryData(
      queryKeys.catalog.categoriesPage(listQuery),
      categoriesResult.data,
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <CategoryListContainer />
      </Suspense>
    </HydrationBoundary>
  );
}
