"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCategoryAction } from "@/modules/catalog/actions/create-category";
import { updateCategoryAction } from "@/modules/catalog/actions/update-category";
import type { CategoryFormDTO } from "@/modules/catalog/types/category.dto";
import { CategoryForm } from "./category-form";
import type { CategoryFormValues } from "./category-form.types";

type CategoryFormContainerProps = {
  mode: "create" | "edit";
  initial?: CategoryFormDTO;
};

function categoryErrorMessage(result: {
  error: string;
  message?: string;
}): string {
  switch (result.error) {
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
        ? `No se pudo guardar la categoría: ${result.message}`
        : "No se pudo guardar la categoría";
  }
}

export function CategoryFormContainer({
  mode,
  initial,
}: CategoryFormContainerProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: CategoryFormValues) {
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
        ? await createCategoryAction(payload)
        : await updateCategoryAction(payload);

    setSubmitting(false);

    if (!result.ok) {
      setError(categoryErrorMessage(result));
      return;
    }

    router.push("/categories");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">
        {mode === "create" ? "Nueva categoría" : "Editar categoría"}
      </h1>
      <CategoryForm
        initial={initial}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}
