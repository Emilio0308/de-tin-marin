"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { cancelOrderAction } from "@/modules/orders/actions/cancel-order";
import { getOrderAction } from "@/modules/orders/actions/get-order";
import { OrderDetailView } from "./order-detail";

export function OrderDetailContainer() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const orderQuery = useQuery({
    queryKey: ["orders", params.id],
    queryFn: async () => {
      const result = await getOrderAction(params.id);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const result = await cancelOrderAction(params.id);
      if (!result.ok) {
        throw new Error(result.error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["orders", params.id] });
    },
  });

  function handleCancel() {
    if (!window.confirm("¿Cancelar esta orden?")) return;
    cancelMutation.mutate();
  }

  if (orderQuery.isLoading) {
    return <p className="p-8 text-sm text-zinc-500">Cargando…</p>;
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">No se pudo cargar la orden.</p>
        <button
          type="button"
          className="mt-4 text-sm underline"
          onClick={() => router.push("/orders")}
        >
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <OrderDetailView
        order={orderQuery.data}
        onCancel={handleCancel}
        cancelling={cancelMutation.isPending}
      />
    </div>
  );
}
