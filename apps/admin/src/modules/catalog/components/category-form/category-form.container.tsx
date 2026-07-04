"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { createCategoryAction } from "@/modules/catalog/actions/create-category";
import { updateCategoryAction } from "@/modules/catalog/actions/update-category";
import { CategoryForm } from "./category-form";
import type {
  CategoryFormContainerProps,
  CategoryFormLabels,
  CategoryFormValues,
} from "./category-form.types";

function categoryErrorMessage(
  result: { error: string; message?: string },
  t: ReturnType<typeof useTranslations<"categoryForm.errors">>,
): string {
  switch (result.error) {
    case "SLUG_TAKEN":
      return t("slugTaken");
    case "VALIDATION":
      return t("validation");
    case "UNAUTHORIZED":
      return t("unauthorized");
    case "FORBIDDEN":
      return t("forbidden");
    default:
      return result.message
        ? t("defaultWithMessage", { message: result.message })
        : t("default");
  }
}

export function CategoryFormContainer({
  mode,
  initial,
}: CategoryFormContainerProps) {
  const t = useTranslations("categoryForm");
  const tErrors = useTranslations("categoryForm.errors");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels: CategoryFormLabels = useMemo(
    () => ({
      breadcrumbParent: t("breadcrumbParent"),
      breadcrumbCurrent:
        mode === "create" ? t("breadcrumbNew") : t("breadcrumbEdit"),
      title: mode === "create" ? t("titleCreate") : t("titleEdit"),
      sectionGeneral: t("sectionGeneral"),
      sectionConfig: t("sectionConfig"),
      name: t("name"),
      nameRequired: t("nameRequired"),
      namePlaceholder: t("namePlaceholder"),
      description: t("description"),
      descriptionOptional: t("descriptionOptional"),
      descriptionPlaceholder: t("descriptionPlaceholder"),
      descriptionMaxHint: t("descriptionMaxHint", { max: 2000 }),
      slug: t("slug"),
      slugUnique: t("slugUnique"),
      slugPrefix: t("slugPrefix"),
      slugPlaceholder: t("slugPlaceholder"),
      slugHint: t("slugHint"),
      sortOrder: t("sortOrder"),
      sortOrderShort: t("sortOrderShort"),
      sortOrderDecrease: t("sortOrderDecrease"),
      sortOrderIncrease: t("sortOrderIncrease"),
      status: t("status"),
      statusYes: t("statusYes"),
      statusNo: t("statusNo"),
      statusActiveTitle: t("statusActiveTitle"),
      statusActiveHint: t("statusActiveHint"),
      tipTitle: t("tipTitle"),
      tipBody: t("tipBody"),
      previewLabel: t("previewLabel"),
      previewFallback: t("previewFallback"),
      cancel: t("cancel"),
      save: t("save"),
      saving: t("saving"),
      formatNameCounter: (current, max) => t("nameCounter", { current, max }),
      formatDescriptionCounter: (current, max) =>
        t("descriptionCounter", { current, max }),
    }),
    [t, mode],
  );

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
      setError(categoryErrorMessage(result, tErrors));
      return;
    }

    router.push("/categories");
    router.refresh();
  }

  function handleCancel() {
    router.push("/categories");
  }

  return (
    <div className="px-margin-mobile py-stack-md sm:px-stack-md flex flex-1 flex-col pb-32 lg:p-8 lg:pb-8">
      <CategoryForm
        initial={initial}
        labels={labels}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}
