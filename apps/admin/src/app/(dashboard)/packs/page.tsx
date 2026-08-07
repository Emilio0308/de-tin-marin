import { Suspense } from "react";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { supabaseConfig } from "@/config/env";
import { PackListContainer } from "@/modules/catalog/components/pack-list/pack-list.container";
import { listPacksPageService } from "@/modules/catalog/services/pack.service";
import { requireStaff } from "@/shared/auth/require-staff";
import { readAdminPackListQuery } from "@/shared/helpers/admin-list-url";
import { searchParamsRecordToURLSearchParams } from "@/shared/helpers/search-params";
import { createAdminQueryClient } from "@/shared/query/create-admin-query-client";
import { queryKeys } from "@/shared/query/query-keys";

type PacksPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PacksPage({ searchParams }: PacksPageProps) {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) redirect("/login");

  const params = searchParamsRecordToURLSearchParams(await searchParams);
  const listQuery = readAdminPackListQuery(params);
  const packsResult = await listPacksPageService(supabaseConfig, listQuery);

  const queryClient = createAdminQueryClient();
  if (packsResult.ok) {
    queryClient.setQueryData(
      queryKeys.catalog.packsPage(listQuery),
      packsResult.data,
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <PackListContainer />
      </Suspense>
    </HydrationBoundary>
  );
}
