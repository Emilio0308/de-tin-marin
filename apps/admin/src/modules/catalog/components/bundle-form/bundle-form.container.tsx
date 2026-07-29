"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { createBundleAction } from "@/modules/catalog/actions/create-bundle";
import { listProductsAction } from "@/modules/catalog/actions/list-products";
import { listSurpriseContainersAction } from "@/modules/catalog/actions/list-surprise-containers";
import { updateBundleAction } from "@/modules/catalog/actions/update-bundle";
import { createCatalogImageUploadUrlAction } from "@/modules/media/actions/create-catalog-image-upload-url";
import { putPresignedCatalogImage } from "@/modules/media/lib/put-presigned-catalog-image";
import type { CatalogImageContentType } from "@/modules/media/schemas/presign-catalog-image.schema";
import { getErrorMessage, logClientError } from "@/shared/errors/client-error";
import { invalidateAdminCatalogLists } from "@/shared/query/query-cache";
import { queryKeys } from "@/shared/query/query-keys";
import { BundleForm } from "./bundle-form";
import { resolveBundleImageUrlForPersist } from "./bundle-form.helpers";
import type {
  BundleFormContainerProps,
  BundleFormLabels,
  BundleFormValues,
  BundleImageUploadResult,
  ProductOption,
} from "./bundle-form.types";

function bundleErrorMessage(
  result: { error: string; message?: string },
  t: ReturnType<typeof useTranslations<"bundleForm.errors">>,
): string {
  switch (result.error) {
    case "VALIDATION":
      return t("validation");
    case "PRODUCT_NOT_FOUND":
      return t("productNotFound");
    case "DUPLICATE_PRODUCT":
      return t("duplicateProduct");
    case "CONTAINER_NOT_FOUND":
      return t("containerNotFound");
    case "NOT_FOUND":
      return t("notFound");
    case "UNAUTHORIZED":
      return t("unauthorized");
    case "FORBIDDEN":
      return t("forbidden");
    case "UNEXPECTED":
      return result.message
        ? t("defaultWithMessage", { message: result.message })
        : t("unexpected");
    default:
      return result.message
        ? t("defaultWithMessage", { message: result.message })
        : t("default");
  }
}

export function BundleFormContainer({
  mode,
  initial,
}: BundleFormContainerProps) {
  const t = useTranslations("bundleForm");
  const tErrors = useTranslations("bundleForm.errors");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: queryKeys.catalog.products(),
    queryFn: async () => {
      const result = await listProductsAction();
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
  });

  const containersQuery = useQuery({
    queryKey: queryKeys.catalog.surpriseContainers(),
    queryFn: async () => {
      const result = await listSurpriseContainersAction();
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
  });

  const labels: BundleFormLabels = useMemo(
    () => ({
      breadcrumbParent: t("breadcrumbParent"),
      breadcrumbCurrent:
        mode === "create" ? t("breadcrumbNew") : t("breadcrumbEdit"),
      title: mode === "create" ? t("titleCreate") : t("titleEdit"),
      sectionGeneral: t("sectionGeneral"),
      sectionImage: t("sectionImage"),
      sectionComposition: t("sectionComposition"),
      sectionConfig: t("sectionConfig"),
      name: t("name"),
      namePlaceholder: t("namePlaceholder"),
      description: t("description"),
      descriptionPlaceholder: t("descriptionPlaceholder"),
      imageUpload: t("imageUpload"),
      imageUploading: t("imageUploading"),
      imageClear: t("imageClear"),
      imageAlt: t("imageAlt"),
      imageEmptyTitle: t("imageEmptyTitle"),
      imageEmptyHint: t("imageEmptyHint"),
      imageFileInvalid: t("imageFileInvalid"),
      productSelectPlaceholder: t("productSelectPlaceholder"),
      addProduct: t("addProduct"),
      emptyItems: t("emptyItems"),
      decreaseUnits: t("decreaseUnits"),
      increaseUnits: t("increaseUnits"),
      removeProduct: t("removeProduct"),
      configActiveTitle: t("configActiveTitle"),
      configActiveHint: t("configActiveHint"),
      container: t("container"),
      containerPlaceholder: t("containerPlaceholder"),
      persons: t("persons"),
      subtotalLabel: t("subtotalLabel"),
      containerLabel: t("containerLabel"),
      totalLabel: t("totalLabel"),
      cancel: t("cancel"),
      save: t("save"),
      saving: t("saving"),
      formatCompositionCount: (count) => t("compositionCount", { count }),
      formatUnitPrice: (price) => t("unitPrice", { price }),
    }),
    [t, mode],
  );

  async function uploadBundleImage(
    file: File,
  ): Promise<BundleImageUploadResult> {
    const presign = await createCatalogImageUploadUrlAction({
      folder: "bundles",
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
    values: BundleFormValues,
    pendingImage: File | null,
  ) {
    setSubmitting(true);
    setError(null);

    try {
      let uploadedPublicUrl: string | null = null;

      if (pendingImage) {
        const upload = await uploadBundleImage(pendingImage);
        if (!upload.ok) {
          setError(upload.error);
          return;
        }
        uploadedPublicUrl = upload.publicUrl;
      }

      const imageUrl = resolveBundleImageUrlForPersist(
        values.imageUrl,
        pendingImage,
        uploadedPublicUrl,
      );

      const base = {
        ...values,
        imageUrl,
      };

      const payload =
        mode === "create"
          ? base
          : {
              id: initial?.id,
              ...base,
            };

      const result =
        mode === "create"
          ? await createBundleAction(payload)
          : await updateBundleAction(payload);

      if (!result.ok) {
        setError(bundleErrorMessage(result, tErrors));
        return;
      }

      await invalidateAdminCatalogLists(queryClient, "bundles");

      startTransition(() => {
        router.push("/bundles");
      });
    } catch (error) {
      logClientError("BundleFormContainer.handleSubmit", error);
      setError(
        tErrors("defaultWithMessage", { message: getErrorMessage(error) }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    router.push("/bundles");
  }

  return (
    <div className="px-margin-mobile py-stack-md sm:px-stack-md flex flex-1 flex-col pb-40 lg:p-8 lg:pb-8">
      {productsQuery.isLoading || containersQuery.isLoading ? (
        <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl mx-auto w-full max-w-5xl border p-12 text-center">
          <p className="font-body text-body-md text-on-surface-variant">
            {t("loadingProducts")}
          </p>
        </div>
      ) : productsQuery.isError ||
        !productsQuery.data?.length ||
        containersQuery.isError ||
        !containersQuery.data?.length ? (
        <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl mx-auto w-full max-w-5xl border p-12 text-center">
          <p className="font-body text-body-md text-on-surface-variant">
            {!productsQuery.data?.length ? t("noProducts") : t("noContainers")}
          </p>
        </div>
      ) : (
        <BundleForm
          initial={initial}
          products={productsQuery.data.map((product): ProductOption => ({
            id: product.id,
            name: product.name,
            unitNetPrice: product.unitNetPrice,
          }))}
          containers={containersQuery.data.map((container) => ({
            id: container.id,
            name: container.name,
            sku: container.sku,
            netPrice: container.netPrice,
          }))}
          labels={labels}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitting={submitting}
          error={error}
        />
      )}
    </div>
  );
}
