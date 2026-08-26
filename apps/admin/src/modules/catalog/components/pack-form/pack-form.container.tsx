"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { createPackAction } from "@/modules/catalog/actions/create-pack";
import { listActiveCampaignsAction } from "@/modules/catalog/actions/list-active-campaigns";
import { updatePackAction } from "@/modules/catalog/actions/update-pack";
import { SHOW_INCLUDE_INACTIVE_PRODUCTS_SWITCH } from "@/modules/catalog/lib/include-inactive-products-switch";
import { createCatalogImageUploadUrlAction } from "@/modules/media/actions/create-catalog-image-upload-url";
import { putPresignedCatalogImage } from "@/modules/media/lib/put-presigned-catalog-image";
import type { CatalogImageContentType } from "@/modules/media/schemas/presign-catalog-image.schema";
import { getErrorMessage, logClientError } from "@/shared/errors/client-error";
import { invalidateAdminCatalogLists } from "@/shared/query/query-cache";
import { queryKeys } from "@/shared/query/query-keys";
import { PackForm } from "./pack-form";
import {
  mergePackProductOptions,
  resolvePackImageUrlForPersist,
} from "./pack-form.helpers";
import type {
  PackFormContainerProps,
  PackFormLabels,
  PackFormValues,
  PackImageUploadResult,
  ProductOption,
} from "./pack-form.types";

function packErrorMessage(
  result: { error: string; message?: string },
  t: ReturnType<typeof useTranslations<"packForm.errors">>,
): string {
  switch (result.error) {
    case "VALIDATION":
      return t("validation");
    case "PRODUCT_NOT_FOUND":
      return t("productNotFound");
    case "DUPLICATE_PRODUCT":
      return t("duplicateProduct");
    case "PRICE_BELOW_REFERENCE":
      return t("priceBelowReference");
    case "SKU_TAKEN":
      return t("skuTaken");
    case "SLUG_TAKEN":
      return t("slugTaken");
    case "CAMPAIGN_NOT_FOUND":
      return t("campaignNotFound");
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

function toPayload(
  values: PackFormValues,
  imageUrl: string | null,
  id?: string,
) {
  const base = {
    sku: values.sku.trim(),
    name: values.name.trim(),
    description: values.description.trim() || null,
    slug: values.slug.trim() || undefined,
    imageUrl,
    normalNetPrice: values.normalNetPrice,
    campaignId: values.campaignId || null,
    purchaseMinQuantity: values.purchaseMinQuantity,
    purchaseMaxQuantity: values.purchaseMaxQuantity,
    isActive: values.isActive,
    items: values.items,
  };

  return id ? { id, ...base } : base;
}

export function PackFormContainer({ mode, initial }: PackFormContainerProps) {
  const t = useTranslations("packForm");
  const tErrors = useTranslations("packForm.errors");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeInactiveProducts, setIncludeInactiveProducts] = useState(false);
  const [pickedProducts, setPickedProducts] = useState<ProductOption[]>([]);

  const productStatus =
    SHOW_INCLUDE_INACTIVE_PRODUCTS_SWITCH && includeInactiveProducts
      ? "all"
      : "active";

  const campaignsQuery = useQuery({
    queryKey: queryKeys.catalog.activeCampaigns(),
    queryFn: async () => {
      const result = await listActiveCampaignsAction();
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
  });

  const labels: PackFormLabels = useMemo(
    () => ({
      breadcrumbParent: t("breadcrumbParent"),
      breadcrumbCurrent:
        mode === "create" ? t("breadcrumbNew") : t("breadcrumbEdit"),
      back: t("back"),
      title: mode === "create" ? t("titleCreate") : t("titleEdit"),
      sectionGeneral: t("sectionGeneral"),
      sectionImage: t("sectionImage"),
      sectionComposition: t("sectionComposition"),
      sectionPricing: t("sectionPricing"),
      sectionConfig: t("sectionConfig"),
      sku: t("sku"),
      skuPlaceholder: t("skuPlaceholder"),
      name: t("name"),
      namePlaceholder: t("namePlaceholder"),
      slug: t("slug"),
      slugPlaceholder: t("slugPlaceholder"),
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
      includeInactiveProducts: t("includeInactiveProducts"),
      includeInactiveProductsHint: t("includeInactiveProductsHint"),
      addProduct: t("addProduct"),
      emptyItems: t("emptyItems"),
      decreasePackages: t("decreasePackages"),
      increasePackages: t("increasePackages"),
      decreaseUnits: t("decreaseUnits"),
      increaseUnits: t("increaseUnits"),
      packagesLabel: t("packagesLabel"),
      unitsLabel: t("unitsLabel"),
      removeProduct: t("removeProduct"),
      referencePrice: t("referencePrice"),
      normalPrice: t("normalPrice"),
      finalPrice: t("finalPrice"),
      campaign: t("campaign"),
      campaignNone: t("campaignNone"),
      purchaseMin: t("purchaseMin"),
      purchaseMax: t("purchaseMax"),
      configActiveTitle: t("configActiveTitle"),
      configActiveHint: t("configActiveHint"),
      cancel: t("cancel"),
      save: t("save"),
      saving: t("saving"),
      formatCompositionCount: (count) => t("compositionCount", { count }),
      formatPackagePrice: (price) => t("packagePrice", { price }),
      formatUnitPrice: (price) => t("unitPrice", { price }),
    }),
    [t, mode],
  );

  const products = useMemo(
    () => mergePackProductOptions(pickedProducts, initial),
    [pickedProducts, initial],
  );

  function handleEnsureProductOption(option: ProductOption) {
    setPickedProducts((current) => {
      if (current.some((product) => product.id === option.id)) return current;
      return [...current, option];
    });
  }

  async function uploadPackImage(file: File): Promise<PackImageUploadResult> {
    const presign = await createCatalogImageUploadUrlAction({
      folder: "packs",
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
    values: PackFormValues,
    pendingImage: File | null,
  ) {
    setSubmitting(true);
    setError(null);

    try {
      let uploadedPublicUrl: string | null = null;

      if (pendingImage) {
        const upload = await uploadPackImage(pendingImage);
        if (!upload.ok) {
          setError(upload.error);
          return;
        }
        uploadedPublicUrl = upload.publicUrl;
      }

      const imageUrl = resolvePackImageUrlForPersist(
        values.imageUrl,
        pendingImage,
        uploadedPublicUrl,
      );

      const payload = toPayload(
        values,
        imageUrl,
        mode === "edit" ? initial?.id : undefined,
      );

      const result =
        mode === "create"
          ? await createPackAction(payload)
          : await updatePackAction(payload);

      if (!result.ok) {
        setError(packErrorMessage(result, tErrors));
        return;
      }

      await invalidateAdminCatalogLists(queryClient, "packs");

      startTransition(() => {
        router.push("/packs");
      });
    } catch (error) {
      logClientError("PackFormContainer.handleSubmit", error);
      setError(
        tErrors("defaultWithMessage", { message: getErrorMessage(error) }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    router.push("/packs");
  }

  const loading = campaignsQuery.isLoading;
  const loadFailed = campaignsQuery.isError;

  return (
    <div className="px-margin-mobile py-stack-md sm:px-stack-md flex flex-1 flex-col pb-40 lg:p-8 lg:pb-8">
      {loading ? (
        <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl mx-auto w-full max-w-5xl border p-12 text-center">
          <p className="font-body text-body-md text-on-surface-variant">
            {t("loadingProducts")}
          </p>
        </div>
      ) : loadFailed ? (
        <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl mx-auto w-full max-w-5xl border p-12 text-center">
          <p className="font-body text-body-md text-on-surface-variant">
            {t("noProducts")}
          </p>
        </div>
      ) : (
        <PackForm
          initial={initial}
          products={products}
          campaigns={campaignsQuery.data ?? []}
          backHref="/packs"
          labels={labels}
          includeInactiveProducts={includeInactiveProducts}
          onIncludeInactiveProductsChange={setIncludeInactiveProducts}
          onEnsureProductOption={handleEnsureProductOption}
          productStatus={productStatus}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitting={submitting}
          error={error}
        />
      )}
    </div>
  );
}
