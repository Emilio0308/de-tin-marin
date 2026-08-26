import { Suspense } from "react";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { supabaseConfig } from "@/config/env";
import { OrderListContainer } from "@/modules/orders/components/order-list/order-list.container";
import { listOrdersPageService } from "@/modules/orders/services/order.service";
import { requireStaff } from "@/shared/auth/require-staff";
import { readAdminOrderListQuery } from "@/shared/helpers/admin-list-url";
import { searchParamsRecordToURLSearchParams } from "@/shared/helpers/search-params";
import { createAdminQueryClient } from "@/shared/query/create-admin-query-client";
import { queryKeys } from "@/shared/query/query-keys";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) redirect("/login");

  const params = searchParamsRecordToURLSearchParams(await searchParams);
  const listQuery = readAdminOrderListQuery(params);
  const ordersResult = await listOrdersPageService(supabaseConfig, listQuery);

  const queryClient = createAdminQueryClient();
  if (ordersResult.ok) {
    queryClient.setQueryData(
      queryKeys.orders.list(listQuery),
      ordersResult.data,
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <OrderListContainer />
      </Suspense>
    </HydrationBoundary>
  );
}
