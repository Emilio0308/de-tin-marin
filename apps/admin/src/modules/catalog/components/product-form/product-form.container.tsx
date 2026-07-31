"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { createProductAction } from "@/modules/catalog/actions/create-product";
import { listCategoriesAction } from "@/modules/catalog/actions/list-categories";
import { updateProductAction } from "@/modules/catalog/actions/update-product";
import { createCatalogImageUploadUrlAction } from "@/modules/media/actions/create-catalog-image-upload-url";
import { putPresignedCatalogImage } from "@/modules/media/lib/put-presigned-catalog-image";
import type { CatalogImageContentType } from "@/modules/media/schemas/presign-catalog-image.schema";
import { getErrorMessage, logClientError } from "@/shared/errors/client-error";
import { invalidateAdminCatalogLists } from "@/shared/query/query-cache";
import { queryKeys } from "@/shared/query/query-keys";
import type { ProductFormDTO } from "@/modules/catalog/types/product.dto";
import { ProductForm } from "./product-form";
import { resolveProductImageUrlForPersist } from "./product-form.helpers";
import type {
  ProductFormLabels,
  ProductFormValues,
  ProductImageUploadResult,
} from "./product-form.types";

type ProductFormContainerProps = {
  mode: "create" | "edit";
  initial?: ProductFormDTO;
};

function productErrorMessage(
  result: { error: string; message?: string },
  t: ReturnType<typeof useTranslations<"productForm.errors">>,
): string {
  switch (result.error) {
    case "SKU_TAKEN":
      return t("skuTaken");
    case "SLUG_TAKEN":
      return t("slugTaken");
    case "VALIDATION":
      return t("validation");
    case "INVALID_PRICE":
      return t("invalidPrice");
    case "NOT_FOUND":
      return t("notFound");
    case "UNEXPECTED":
      return result.message
        ? t("defaultWithMessage", { message: result.message })
        : t("default");
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

export function ProductFormContainer({
  mode,
  initial,
}: ProductFormContainerProps) {
  const t = useTranslations("productForm");
  const tErrors = useTranslations("productForm.errors");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels: ProductFormLabels = useMemo(
    () => ({
      breadcrumbParent: t("breadcrumbParent"),
      breadcrumbCurrent:
        mode === "create" ? t("breadcrumbNew") : t("breadcrumbEdit"),
      title: mode === "create" ? t("titleCreate") : t("titleEdit"),
      status: t("status"),
      statusActive: t("statusActive"),
      statusInactive: t("statusInactive"),
      statusToggle: t("statusToggle"),
      sku: t("sku"),
      skuPlaceholder: t("skuPlaceholder"),
      name: t("name"),
      namePlaceholder: t("namePlaceholder"),
      slug: t("slug"),
      slugPrefix: t("slugPrefix"),
      slugPlaceholder: t("slugPlaceholder"),
      image: t("image"),
      imagePreview: t("imagePreview"),
      imageAlt: t("imageAlt"),
      imageUpload: t("imageUpload"),
      imageUploading: t("imageUploading"),
      imageClear: t("imageClear"),
      imageEmptyHint: t("imageEmptyHint"),
      imageFileInvalid: t("imageFileInvalid"),
      brand: t("brand"),
      brandPlaceholder: t("brandPlaceholder"),
      category: t("category"),
      categoryPlaceholder: t("categoryPlaceholder"),
      productType: t("productType"),
      productTypeUnit: t("productTypeUnit"),
      productTypePackage: t("productTypePackage"),
      productTypeHint: t("productTypeHint"),
      packageSection: t("packageSection"),
      itemsPerPackage: t("itemsPerPackage"),
      packageLabel: t("packageLabel"),
      packageLabelPlaceholder: t("packageLabelPlaceholder"),
      packagePrice: t("packagePrice"),
      unitPrice: t("unitPrice"),
      unitPricePreview: t("unitPricePreview"),
      costNetPrice: t("costNetPrice"),
      costNetPriceHint: t("costNetPriceHint"),
      margin: t("margin"),
      marginPct: t("marginPct"),
      marginEmpty: t("marginEmpty"),
      formatMargin: (amount) => t("formatMargin", { amount }),
      formatMarginPct: (pct) => t("formatMarginPct", { pct }),
      stock: t("stock"),
      stockSealed: t("stockSealed"),
      stockLoose: t("stockLoose"),
      stockUnitsOnly: t("stockUnitsOnly"),
      stockDecrease: t("stockDecrease"),
      stockIncrease: t("stockIncrease"),
      purchaseLimits: t("purchaseLimits"),
      purchaseMinQuantity: t("purchaseMinQuantity"),
      purchaseMaxQuantity: t("purchaseMaxQuantity"),
      purchaseLimitsHint: t("purchaseLimitsHint"),
      description: t("description"),
      descriptionPlaceholder: t("descriptionPlaceholder"),
      tipTitle: t("tipTitle"),
      tipBody: t("tipBody"),
      cancel: t("cancel"),
      save: t("save"),
      saving: t("saving"),
      formatUnitPrice: (price) => t("formatUnitPrice", { price }),
      formatStockTotal: (total) => t("formatStockTotal", { total }),
    }),
    [t, mode],
  );

  const categoriesQuery = useQuery({
    queryKey: queryKeys.catalog.categories(),
    queryFn: async () => {
      const result = await listCategoriesAction();
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
  });

  async function uploadProductImage(
    file: File,
  ): Promise<ProductImageUploadResult> {
    const presign = await createCatalogImageUploadUrlAction({
      folder: "products",
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
    values: ProductFormValues,
    pendingImage: File | null,
  ) {
    setSubmitting(true);
    setError(null);

    try {
      let uploadedPublicUrl: string | null = null;

      if (pendingImage) {
        const upload = await uploadProductImage(pendingImage);
        if (!upload.ok) {
          setError(upload.error);
          return;
        }
        uploadedPublicUrl = upload.publicUrl;
      }

      const imageUrl = resolveProductImageUrlForPersist(
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
          ? await createProductAction(payload)
          : await updateProductAction(payload);

      if (!result.ok) {
        setError(productErrorMessage(result, tErrors));
        return;
      }

      await invalidateAdminCatalogLists(queryClient, "products");

      router.push("/products");
      router.refresh();
    } catch (error) {
      logClientError("ProductFormContainer.handleSubmit", error);
      setError(
        tErrors("defaultWithMessage", { message: getErrorMessage(error) }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    router.push("/products");
  }

  return (
    <div className="px-margin-mobile py-stack-md sm:px-stack-md flex flex-1 flex-col pb-24 lg:p-8">
      {categoriesQuery.isLoading ? (
        <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl mx-auto w-full max-w-5xl border p-12 text-center">
          <p className="font-body text-body-md text-on-surface-variant">
            {t("loadingCategories")}
          </p>
        </div>
      ) : categoriesQuery.isError || !categoriesQuery.data?.length ? (
        <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl mx-auto w-full max-w-5xl border p-12 text-center">
          <p className="font-body text-body-md text-on-surface-variant">
            {t("noCategories")}
          </p>
        </div>
      ) : (
        <ProductForm
          initial={initial}
          categories={categoriesQuery.data}
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
