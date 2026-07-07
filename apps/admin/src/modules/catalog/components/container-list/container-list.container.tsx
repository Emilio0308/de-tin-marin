"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@de-tin-marin/ui/button";
import { listSurpriseContainersAction } from "@/modules/catalog/actions/list-surprise-containers";
import { softDeleteSurpriseContainerAction } from "@/modules/catalog/actions/soft-delete-surprise-container";

export function ContainerListContainer() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["surprise-containers"],
    queryFn: async () => {
      const result = await listSurpriseContainersAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await softDeleteSurpriseContainerAction(id);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["surprise-containers"],
      });
    },
  });

  if (query.isLoading) {
    return <p className="p-8 text-sm text-zinc-500">Cargando envases…</p>;
  }

  if (query.isError) {
    return (
      <p className="p-8 text-sm text-red-600">No se pudieron cargar envases.</p>
    );
  }

  const containers = query.data ?? [];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Envases de sorpresa</h1>
          <p className="text-zinc-600">Insumos con stock y precio por unidad</p>
        </div>
        <Link href="/containers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo envase
          </Button>
        </Link>
      </div>

      {containers.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay envases registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((container) => (
                <tr key={container.id} className="border-t">
                  <td className="px-4 py-3">{container.sku}</td>
                  <td className="px-4 py-3">{container.name}</td>
                  <td className="px-4 py-3">
                    S/ {container.netPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{container.stockQuantity}</td>
                  <td className="px-4 py-3">
                    {container.isActive ? "Activo" : "Inactivo"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/containers/${container.id}/edit`}>
                        <Button variant="secondary">Editar</Button>
                      </Link>
                      <Button
                        variant="secondary"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (!window.confirm("¿Eliminar este envase?")) return;
                          deleteMutation.mutate(container.id);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
