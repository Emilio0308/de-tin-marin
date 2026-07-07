"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { createSurpriseContainerAction } from "@/modules/catalog/actions/create-surprise-container";
import { updateSurpriseContainerAction } from "@/modules/catalog/actions/update-surprise-container";
import { ContainerForm } from "./container-form";
import type {
  ContainerFormContainerProps,
  ContainerFormLabels,
  ContainerFormValues,
} from "./container-form.types";

function containerErrorMessage(
  result: { error: string; message?: string },
  t: ReturnType<typeof useTranslations<"containerForm.errors">>,
): string {
  switch (result.error) {
    case "DUPLICATE_SKU":
      return t("duplicateSku");
    case "VALIDATION":
      return t("validation");
    case "UNAUTHORIZED":
      return t("unauthorized");
    case "FORBIDDEN":
      return t("forbidden");
    case "NOT_FOUND":
      return t("notFound");
    default:
      return result.message
        ? t("defaultWithMessage", { message: result.message })
        : t("default");
  }
}

export function ContainerFormContainer({
  mode,
  initial,
}: ContainerFormContainerProps) {
  const t = useTranslations("containerForm");
  const tErrors = useTranslations("containerForm.errors");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels: ContainerFormLabels = useMemo(
    () => ({
      breadcrumbParent: t("breadcrumbParent"),
      breadcrumbCurrent:
        mode === "create" ? t("breadcrumbNew") : t("breadcrumbEdit"),
      title: mode === "create" ? t("titleCreate") : t("titleEdit"),
      sectionInfo: t("sectionInfo"),
      sectionImage: t("sectionImage"),
      sectionFinance: t("sectionFinance"),
      sectionConfig: t("sectionConfig"),
      sku: t("sku"),
      skuRequired: t("skuRequired"),
      skuPlaceholder: t("skuPlaceholder"),
      name: t("name"),
      nameRequired: t("nameRequired"),
      namePlaceholder: t("namePlaceholder"),
      description: t("description"),
      descriptionPlaceholder: t("descriptionPlaceholder"),
      imageUrl: t("imageUrl"),
      imageUrlPlaceholder: t("imageUrlPlaceholder"),
      imageVerify: t("imageVerify"),
      imageInvalid: t("imageInvalid"),
      imagePreview: t("imagePreview"),
      imagePreviewEmpty: t("imagePreviewEmpty"),
      imageHint: t("imageHint"),
      imageAlt: t("imageAlt"),
      netPrice: t("netPrice"),
      netPriceRequired: t("netPriceRequired"),
      stock: t("stock"),
      stockShort: t("stockShort"),
      stockRequired: t("stockRequired"),
      stockDecrease: t("stockDecrease"),
      stockIncrease: t("stockIncrease"),
      statusActiveTitle: t("statusActiveTitle"),
      statusActiveHint: t("statusActiveHint"),
      statusYes: t("statusYes"),
      statusNo: t("statusNo"),
      tipTitle: t("tipTitle"),
      tipBody: t("tipBody"),
      previewLabel: t("previewLabel"),
      previewFallback: t("previewFallback"),
      cancel: t("cancel"),
      save: t("save"),
      saving: t("saving"),
    }),
    [t, mode],
  );

  async function handleSubmit(values: ContainerFormValues) {
    setSubmitting(true);
    setError(null);

    const payload = {
      ...values,
      description: values.description || null,
      imageUrl: values.imageUrl || null,
    };

    const result =
      mode === "create"
        ? await createSurpriseContainerAction(payload)
        : await updateSurpriseContainerAction({
            id: initial?.id,
            ...payload,
          });

    setSubmitting(false);

    if (!result.ok) {
      setError(containerErrorMessage(result, tErrors));
      return;
    }

    router.push("/containers");
    router.refresh();
  }

  function handleCancel() {
    router.push("/containers");
  }

  return (
    <div className="px-margin-mobile py-stack-md sm:px-stack-md flex flex-1 flex-col pb-32 lg:p-8 lg:pb-8">
      <ContainerForm
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
