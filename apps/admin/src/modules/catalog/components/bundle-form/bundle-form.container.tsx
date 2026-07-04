"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { createBundleAction } from "@/modules/catalog/actions/create-bundle";
import { listProductsAction } from "@/modules/catalog/actions/list-products";
import { updateBundleAction } from "@/modules/catalog/actions/update-bundle";
import { BundleForm } from "./bundle-form";
import type {
  BundleFormContainerProps,
  BundleFormLabels,
  BundleFormValues,
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
    case "NOT_FOUND":
      return t("notFound");
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
    queryKey: ["products"],
    queryFn: async () => {
      const result = await listProductsAction();
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
      imageUrl: t("imageUrl"),
      imageUrlPlaceholder: t("imageUrlPlaceholder"),
      imageAlt: t("imageAlt"),
      imageEmptyTitle: t("imageEmptyTitle"),
      imageEmptyHint: t("imageEmptyHint"),
      productSelectPlaceholder: t("productSelectPlaceholder"),
      addProduct: t("addProduct"),
      emptyItems: t("emptyItems"),
      decreaseUnits: t("decreaseUnits"),
      increaseUnits: t("increaseUnits"),
      removeProduct: t("removeProduct"),
      configActiveTitle: t("configActiveTitle"),
      configActiveHint: t("configActiveHint"),
      serviceFee: t("serviceFee"),
      persons: t("persons"),
      subtotalLabel: t("subtotalLabel"),
      feeLabel: t("feeLabel"),
      totalLabel: t("totalLabel"),
      cancel: t("cancel"),
      save: t("save"),
      saving: t("saving"),
      formatCompositionCount: (count) => t("compositionCount", { count }),
      formatUnitPrice: (price) => t("unitPrice", { price }),
    }),
    [t, mode],
  );

  async function handleSubmit(values: BundleFormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const payload =
        mode === "create"
          ? values
          : {
              id: initial?.id,
              ...values,
            };

      const result =
        mode === "create"
          ? await createBundleAction(payload)
          : await updateBundleAction(payload);

      if (!result.ok) {
        setError(bundleErrorMessage(result, tErrors));
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["bundles"] });

      startTransition(() => {
        router.push("/bundles");
      });
    } catch {
      setError(tErrors("unexpected"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    router.push("/bundles");
  }

  return (
    <div className="px-margin-mobile py-stack-md sm:px-stack-md flex flex-1 flex-col pb-40 lg:p-8 lg:pb-8">
      {productsQuery.isLoading ? (
        <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl mx-auto w-full max-w-5xl border p-12 text-center">
          <p className="font-body text-body-md text-on-surface-variant">
            {t("loadingProducts")}
          </p>
        </div>
      ) : productsQuery.isError || !productsQuery.data?.length ? (
        <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl mx-auto w-full max-w-5xl border p-12 text-center">
          <p className="font-body text-body-md text-on-surface-variant">
            {t("noProducts")}
          </p>
        </div>
      ) : (
        <BundleForm
          initial={initial}
          products={productsQuery.data.map((product): ProductOption => ({
            id: product.id,
            name: product.name,
            netPrice: product.netPrice,
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
