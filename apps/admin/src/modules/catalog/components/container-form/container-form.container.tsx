"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { createSurpriseContainerAction } from "@/modules/catalog/actions/create-surprise-container";
import { updateSurpriseContainerAction } from "@/modules/catalog/actions/update-surprise-container";
import { createCatalogImageUploadUrlAction } from "@/modules/media/actions/create-catalog-image-upload-url";
import { putPresignedCatalogImage } from "@/modules/media/lib/put-presigned-catalog-image";
import type { CatalogImageContentType } from "@/modules/media/schemas/presign-catalog-image.schema";
import { getErrorMessage, logClientError } from "@/shared/errors/client-error";
import { invalidateAdminCatalogLists } from "@/shared/query/query-cache";
import { ContainerForm } from "./container-form";
import { resolveContainerImageUrlForPersist } from "./container-form.helpers";
import type {
  ContainerFormContainerProps,
  ContainerFormLabels,
  ContainerFormValues,
  ContainerImageUploadResult,
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
    case "UNEXPECTED":
      return result.message
        ? t("defaultWithMessage", { message: result.message })
        : t("default");
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
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels: ContainerFormLabels = useMemo(
    () => ({
      breadcrumbParent: t("breadcrumbParent"),
      breadcrumbCurrent:
        mode === "create" ? t("breadcrumbNew") : t("breadcrumbEdit"),
      back: t("back"),
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
      imageUpload: t("imageUpload"),
      imageUploading: t("imageUploading"),
      imageClear: t("imageClear"),
      imageEmptyHint: t("imageEmptyHint"),
      imageFileInvalid: t("imageFileInvalid"),
      imagePreview: t("imagePreview"),
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

  async function uploadContainerImage(
    file: File,
  ): Promise<ContainerImageUploadResult> {
    const presign = await createCatalogImageUploadUrlAction({
      folder: "containers",
      contentType: file.type as CatalogImageContentType,
      contentLength: file.size,
      fileName: file.name,
    });

    if (!presign.ok) {
      if (presign.error === "UNAUTHORIZED") {
        return { ok: false, error: tErrors("unauthorized") };
      }
      if (presign.error === "FORBIDDEN") {
        return { ok: false, error: tErrors("forbidden") };
      }
      if (presign.error === "VALIDATION") {
        return { ok: false, error: t("imageFileInvalid") };
      }
      return {
        ok: false,
        error:
          "message" in presign && presign.message
            ? t("imageUploadFailedWithMessage", { message: presign.message })
            : t("imageUploadFailed"),
      };
    }

    const put = await putPresignedCatalogImage(presign.data.uploadUrl, file);
    if (!put.ok) {
      return {
        ok: false,
        error: t("imageUploadFailedWithMessage", { message: put.message }),
      };
    }

    return { ok: true, publicUrl: presign.data.publicUrl };
  }

  async function handleSubmit(
    values: ContainerFormValues,
    pendingImage: File | null,
  ) {
    setSubmitting(true);
    setError(null);

    try {
      let uploadedPublicUrl: string | null = null;

      if (pendingImage) {
        const upload = await uploadContainerImage(pendingImage);
        if (!upload.ok) {
          setError(upload.error);
          return;
        }
        uploadedPublicUrl = upload.publicUrl;
      }

      const imageUrl = resolveContainerImageUrlForPersist(
        values.imageUrl,
        pendingImage,
        uploadedPublicUrl,
      );

      const payload = {
        ...values,
        description: values.description || null,
        imageUrl,
      };

      const result =
        mode === "create"
          ? await createSurpriseContainerAction(payload)
          : await updateSurpriseContainerAction({
              id: initial?.id,
              ...payload,
            });

      if (!result.ok) {
        setError(containerErrorMessage(result, tErrors));
        return;
      }

      await invalidateAdminCatalogLists(queryClient, "surpriseContainers");

      router.push("/containers");
      router.refresh();
    } catch (error) {
      logClientError("ContainerFormContainer.handleSubmit", error);
      setError(
        tErrors("defaultWithMessage", { message: getErrorMessage(error) }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    router.push("/containers");
  }

  return (
    <div className="px-margin-mobile py-stack-md sm:px-stack-md flex flex-1 flex-col pb-32 lg:p-8 lg:pb-8">
      <ContainerForm
        initial={initial}
        backHref="/containers"
        labels={labels}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}
