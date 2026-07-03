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
      setError(
        result.error === "SLUG_TAKEN"
          ? "El slug ya está en uso"
          : result.error === "VALIDATION"
            ? "Revisa los campos del formulario"
            : "No se pudo guardar la categoría",
      );
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
