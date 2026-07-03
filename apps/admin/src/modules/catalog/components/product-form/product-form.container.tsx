"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProductAction } from "@/modules/catalog/actions/create-product";
import { listCategoriesAction } from "@/modules/catalog/actions/list-categories";
import { updateProductAction } from "@/modules/catalog/actions/update-product";
import type { ProductFormDTO } from "@/modules/catalog/types/product.dto";
import { ProductForm } from "./product-form";
import type { ProductFormValues } from "./product-form.types";

type ProductFormContainerProps = {
  mode: "create" | "edit";
  initial?: ProductFormDTO;
};

function productErrorMessage(result: {
  error: string;
  message?: string;
}): string {
  switch (result.error) {
    case "SKU_TAKEN":
      return "El SKU ya está en uso";
    case "SLUG_TAKEN":
      return "El slug ya está en uso";
    case "VALIDATION":
      return "Revisa los campos del formulario";
    case "UNAUTHORIZED":
      return "Tu sesión expiró. Inicia sesión de nuevo.";
    case "FORBIDDEN":
      return "No tienes permisos de administrador.";
    default:
      return result.message
        ? `No se pudo guardar el producto: ${result.message}`
        : "No se pudo guardar el producto";
  }
}

export function ProductFormContainer({
  mode,
  initial,
}: ProductFormContainerProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const result = await listCategoriesAction();
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
  });

  async function handleSubmit(values: ProductFormValues) {
    setSubmitting(true);
    setError(null);

    const payload =
      mode === "create"
        ? values
        : {
            id: initial?.id,
            ...values,
          };

    const result =
      mode === "create"
        ? await createProductAction(payload)
        : await updateProductAction(payload);

    setSubmitting(false);

    if (!result.ok) {
      setError(productErrorMessage(result));
      return;
    }

    router.push("/products");
    router.refresh();
  }

  if (categoriesQuery.isLoading) {
    return <p className="p-8 text-sm text-zinc-500">Cargando categorías…</p>;
  }

  if (categoriesQuery.isError || !categoriesQuery.data?.length) {
    return (
      <p className="p-8 text-sm text-red-600">
        Crea al menos una categoría antes de agregar productos.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">
        {mode === "create" ? "Nuevo producto" : "Editar producto"}
      </h1>
      <ProductForm
        initial={initial}
        categories={categoriesQuery.data}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}
