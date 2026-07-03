"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@de-tin-marin/ui/button";
import { listBundlesAction } from "@/modules/catalog/actions/list-bundles";
import { softDeleteBundleAction } from "@/modules/catalog/actions/soft-delete-bundle";
import { BundleList } from "./bundle-list";

export function BundleListContainer() {
  const queryClient = useQueryClient();
  const bundlesQuery = useQuery({
    queryKey: ["bundles"],
    queryFn: async () => {
      const result = await listBundlesAction();
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await softDeleteBundleAction(id);
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bundles"] });
    },
  });

  function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este paquete?")) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paquetes</h1>
          <p className="text-zinc-600">Plantillas de sorpresas</p>
        </div>
        <Link href="/bundles/new">
          <Button>Nuevo paquete</Button>
        </Link>
      </div>

      {bundlesQuery.isLoading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : bundlesQuery.isError ? (
        <p className="text-sm text-red-600">Error al cargar paquetes</p>
      ) : (
        <BundleList
          bundles={bundlesQuery.data ?? []}
          onDelete={handleDelete}
          deletingId={
            deleteMutation.isPending ? (deleteMutation.variables ?? null) : null
          }
        />
      )}
    </div>
  );
}
