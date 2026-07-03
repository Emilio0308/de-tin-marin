"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@de-tin-marin/ui/button";
import { listCategoriesAction } from "@/modules/catalog/actions/list-categories";
import { softDeleteCategoryAction } from "@/modules/catalog/actions/soft-delete-category";
import { CategoryList } from "./category-list";

export function CategoryListContainer() {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const result = await listCategoriesAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await softDeleteCategoryAction(id);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta categoría?")) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorías</h1>
          <p className="text-zinc-600">Organiza el catálogo de productos</p>
        </div>
        <Link href="/categories/new">
          <Button>Nueva categoría</Button>
        </Link>
      </div>

      {categoriesQuery.isLoading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : categoriesQuery.isError ? (
        <p className="text-sm text-red-600">Error al cargar categorías</p>
      ) : (
        <CategoryList
          categories={categoriesQuery.data ?? []}
          onDelete={handleDelete}
          deletingId={
            deleteMutation.isPending ? (deleteMutation.variables ?? null) : null
          }
        />
      )}
    </div>
  );
}
