"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@de-tin-marin/ui/button";
import { listOrdersAction } from "@/modules/orders/actions/list-orders";
import { OrderList } from "./order-list";

export function OrderListContainer() {
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
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Órdenes</h1>
          <p className="text-zinc-600">Pedidos y carritos congelados</p>
        </div>
        <Link href="/orders/new">
          <Button>Nueva orden</Button>
        </Link>
      </div>

      {ordersQuery.isLoading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : ordersQuery.isError ? (
        <p className="text-sm text-red-600">Error al cargar órdenes</p>
      ) : (
        <OrderList orders={ordersQuery.data ?? []} />
      )}
    </div>
  );
}
