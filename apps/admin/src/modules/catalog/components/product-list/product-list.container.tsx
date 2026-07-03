"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@de-tin-marin/ui/button";
import { listProductsAction } from "@/modules/catalog/actions/list-products";
import { softDeleteProductAction } from "@/modules/catalog/actions/soft-delete-product";
import { ProductList } from "./product-list";

export function ProductListContainer() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const result = await listProductsAction();
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await softDeleteProductAction(id);
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este producto?")) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-zinc-600">Catálogo de dulces y productos</p>
        </div>
        <Link href="/products/new">
          <Button>Nuevo producto</Button>
        </Link>
      </div>

      {productsQuery.isLoading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : productsQuery.isError ? (
        <p className="text-sm text-red-600">Error al cargar productos</p>
      ) : (
        <ProductList
          products={productsQuery.data ?? []}
          onDelete={handleDelete}
          deletingId={
            deleteMutation.isPending ? (deleteMutation.variables ?? null) : null
          }
        />
      )}
    </div>
  );
}
