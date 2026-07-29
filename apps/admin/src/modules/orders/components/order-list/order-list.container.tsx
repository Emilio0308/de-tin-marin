"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { ORDER_STATUSES } from "@de-tin-marin/shared/order-cart";
import { Button } from "@de-tin-marin/ui/button";
import { listOrdersAction } from "@/modules/orders/actions/list-orders";
import { OrderList } from "./order-list";
import type { OrderListLabels } from "./order-list.types";

export function OrderListContainer() {
  const t = useTranslations("orders");
  const tDashboard = useTranslations("dashboard.orderStatus");

  const labels = useMemo<OrderListLabels>(() => {
    const statusLabels = Object.fromEntries(
      ORDER_STATUSES.map((status) => [status, tDashboard(status)]),
    );
    return {
      columns: {
        orderNumber: t("list.columns.orderNumber"),
        customer: t("list.columns.customer"),
        status: t("list.columns.status"),
        payment: t("list.columns.payment"),
        total: t("list.columns.total"),
        lines: t("list.columns.lines"),
        date: t("list.columns.date"),
        actions: t("list.columns.actions"),
      },
      view: t("list.view"),
      empty: t("list.empty"),
      statusLabels,
      paymentStatusLabels: {
        pending: t("paymentStatus.pending"),
        confirmed: t("paymentStatus.confirmed"),
        refunded: t("paymentStatus.refunded"),
      },
      formatLines: (count) => t("list.formatLines", { count }),
    };
  }, [t, tDashboard]);

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const result = await listOrdersAction();
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
  });

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-on-surface text-3xl font-bold tracking-tight">
            {t("list.title")}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mt-1">
            {t("list.subtitle")}
          </p>
        </div>
        <Link href="/orders/new">
          <Button className="font-label text-label-bold gap-2">
            <Plus className="h-4 w-4" />
            {t("list.newOrder")}
          </Button>
        </Link>
      </div>

      {ordersQuery.isLoading ? (
        <p className="font-body text-body-sm text-on-surface-variant">
          {t("list.loading")}
        </p>
      ) : ordersQuery.isError ? (
        <p className="font-body text-body-sm text-error">
          {t("list.loadError")}
        </p>
      ) : (
        <OrderList orders={ordersQuery.data ?? []} labels={labels} />
      )}
    </div>
  );
}
