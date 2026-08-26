import { Suspense } from "react";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { supabaseConfig } from "@/config/env";
import { ContainerListContainer } from "@/modules/catalog/components/container-list/container-list.container";
import { listSurpriseContainersPageService } from "@/modules/catalog/services/surprise-container.service";
import { requireStaff } from "@/shared/auth/require-staff";
import { readAdminContainerListQuery } from "@/shared/helpers/admin-list-url";
import { searchParamsRecordToURLSearchParams } from "@/shared/helpers/search-params";
import { createAdminQueryClient } from "@/shared/query/create-admin-query-client";
import { queryKeys } from "@/shared/query/query-keys";

type ContainersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContainersPage({
  searchParams,
}: ContainersPageProps) {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) redirect("/login");

  const params = searchParamsRecordToURLSearchParams(await searchParams);
  const listQuery = readAdminContainerListQuery(params);
  const containersResult = await listSurpriseContainersPageService(
    supabaseConfig,
    listQuery,
  );

  const queryClient = createAdminQueryClient();
  if (containersResult.ok) {
    queryClient.setQueryData(
      queryKeys.catalog.surpriseContainersPage(listQuery),
      containersResult.data,
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <ContainerListContainer />
      </Suspense>
    </HydrationBoundary>
  );
}
