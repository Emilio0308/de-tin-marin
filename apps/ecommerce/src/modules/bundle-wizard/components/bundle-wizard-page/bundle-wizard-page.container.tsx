"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  BUNDLE_CUSTOMIZATION_MAX,
  BUNDLE_CUSTOMIZATION_MIN,
  validateBundleCustomization,
  type BundleWizardTemplate,
  type CustomizeBundleComponent,
} from "@de-tin-marin/validations/customize-bundle";
import { listPublicProductsAction } from "@/modules/catalog/actions/list-public-products";
import { previewBundleLineAction } from "@/modules/bundle-wizard/actions/preview-bundle-line";
import {
  addComponent,
  buildComponentLabels,
  canAddComponent,
  canRemoveComponent,
  removeComponent,
} from "@/modules/bundle-wizard/helpers/wizard-state";
import { clearPendingCartLines } from "@/modules/bundle-wizard/helpers/pending-cart";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { queryKeys } from "@/shared/query/query-keys";
import { BundleWizardPage } from "./bundle-wizard-page";

export type BundleWizardPageContainerProps = {
  template: BundleWizardTemplate;
};

export function BundleWizardPageContainer({
  template,
}: BundleWizardPageContainerProps) {
  const t = useTranslations("catalog.wizard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { addBundleLine } = useCart();
  const [, startTransition] = useTransition();
  const [components, setComponents] = useState<CustomizeBundleComponent[]>(
    () => template.initialComponents,
  );
  const [debouncedComponents, setDebouncedComponents] =
    useState<CustomizeBundleComponent[]>(components);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pickerLabels, setPickerLabels] = useState<Record<string, string>>({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedComponents(components);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [components]);

  const validation = useMemo(
    () => validateBundleCustomization(components),
    [components],
  );
  const isValid = validation.ok;

  const selectedProductIds = useMemo(
    () => new Set(components.map((component) => component.productId)),
    [components],
  );

  const labelsByProductId = useMemo(
    () => buildComponentLabels(template.items, pickerLabels),
    [pickerLabels, template.items],
  );

  const productsQuery = useQuery({
    queryKey: queryKeys.wizard.productSearch(searchQuery),
    queryFn: async () => {
      const result = await listPublicProductsAction({
        page: 1,
        pageSize: 12,
        search: searchQuery || undefined,
        sort: "name_asc",
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const previewQuery = useQuery({
    queryKey: queryKeys.wizard.preview(template.bundleId, debouncedComponents),
    queryFn: async () => {
      const result = await previewBundleLineAction({
        bundleId: template.bundleId,
        components: debouncedComponents,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: validateBundleCustomization(debouncedComponents).ok,
  });

  const unitPricesByProductId = useMemo(() => {
    const prices: Record<string, number> = {};
    for (const component of previewQuery.data?.line.components ?? []) {
      prices[component.productId] = component.unitPrice;
    }
    return prices;
  }, [previewQuery.data?.line.components]);

  const handleRemove = (productId: string) => {
    setComponents((current) => removeComponent(current, productId));
  };

  const handleAdd = (product: { id: string; name: string }) => {
    setPickerLabels((current) => ({ ...current, [product.id]: product.name }));
    setComponents((current) => addComponent(current, product.id));
  };

  const handleAddToCart = () => {
    if (isAddingToCart || !previewQuery.data?.line || !isValid) return;
    setIsAddingToCart(true);
    addBundleLine(previewQuery.data.line);
    clearPendingCartLines();
    router.push("/carrito");
  };

  return (
    <BundleWizardPage
      template={template}
      components={components}
      searchValue={searchDraft}
      products={productsQuery.data?.items ?? []}
      selectedProductIds={selectedProductIds}
      labelsByProductId={labelsByProductId}
      unitPricesByProductId={unitPricesByProductId}
      lineTotal={previewQuery.data?.lineTotal ?? null}
      stockCheck={previewQuery.data?.stockCheck ?? null}
      isValid={isValid}
      canRemove={canRemoveComponent(components)}
      canAdd={canAddComponent(components)}
      isPreviewLoading={previewQuery.isFetching}
      isPreviewError={previewQuery.isError}
      isProductsLoading={productsQuery.isLoading}
      isProductsError={productsQuery.isError}
      isAddingToCart={isAddingToCart}
      labels={{
        back: t("back"),
        title: t("title"),
        personCount: t("personCount", { count: template.personCount }),
        addToCart: t("addToCart"),
        validationMin: t("validation.min", { min: BUNDLE_CUSTOMIZATION_MIN }),
        validationMax: t("validation.max", { max: BUNDLE_CUSTOMIZATION_MAX }),
        validationDuplicate: t("validation.duplicate"),
        componentList: {
          title: t("componentList.title"),
          remove: t("componentList.remove"),
          minReached: t("componentList.minReached", {
            min: BUNDLE_CUSTOMIZATION_MIN,
          }),
          count: t("componentList.count", {
            current: components.length,
            max: BUNDLE_CUSTOMIZATION_MAX,
          }),
        },
        picker: {
          title: t("picker.title"),
          searchPlaceholder: t("picker.searchPlaceholder"),
          searchAriaLabel: t("picker.searchAriaLabel"),
          add: t("picker.add"),
          empty: t("picker.empty"),
          maxReached: t("picker.maxReached", { max: BUNDLE_CUSTOMIZATION_MAX }),
          alreadyAdded: t("picker.alreadyAdded"),
          loading: tCommon("loading"),
          error: tCommon("error"),
          retry: tCommon("retry"),
        },
        price: {
          total: t("price.total"),
          loading: t("price.loading"),
          invalid: t("price.invalid"),
          previewError: t("price.previewError"),
          retry: tCommon("retry"),
        },
        stock: {
          title: t("stock.title"),
          productShortage: t("stock.productShortage"),
          containerShortage: t("stock.containerShortage"),
        },
      }}
      onRemove={handleRemove}
      onAdd={handleAdd}
      onSearchChange={setSearchDraft}
      onSearchSubmit={() => {
        startTransition(() => {
          setSearchQuery(searchDraft.trim());
        });
      }}
      onProductsRetry={() => {
        void productsQuery.refetch();
      }}
      onPreviewRetry={() => {
        void previewQuery.refetch();
      }}
      onAddToCart={handleAddToCart}
    />
  );
}
