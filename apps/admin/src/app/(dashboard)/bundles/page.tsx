import { Suspense } from "react";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { supabaseConfig } from "@/config/env";
import { BundleListContainer } from "@/modules/catalog/components/bundle-list/bundle-list.container";
import { listBundlesPageService } from "@/modules/catalog/services/bundle.service";
import { requireStaff } from "@/shared/auth/require-staff";
import { readAdminBundleListQuery } from "@/shared/helpers/admin-list-url";
import { searchParamsRecordToURLSearchParams } from "@/shared/helpers/search-params";
import { createAdminQueryClient } from "@/shared/query/create-admin-query-client";
import { queryKeys } from "@/shared/query/query-keys";

type BundlesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BundlesPage({ searchParams }: BundlesPageProps) {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) redirect("/login");

  const params = searchParamsRecordToURLSearchParams(await searchParams);
  const listQuery = readAdminBundleListQuery(params);
  const bundlesResult = await listBundlesPageService(supabaseConfig, listQuery);

  const queryClient = createAdminQueryClient();
  if (bundlesResult.ok) {
    queryClient.setQueryData(
      queryKeys.catalog.bundlesPage(listQuery),
      bundlesResult.data,
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <BundleListContainer />
      </Suspense>
    </HydrationBoundary>
  );
}
