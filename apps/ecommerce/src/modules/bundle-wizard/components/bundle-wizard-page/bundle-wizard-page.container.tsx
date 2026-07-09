"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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
  buildComponentImages,
  buildComponentLabels,
  canAddComponent,
  canRemoveComponent,
  removeComponent,
} from "@/modules/bundle-wizard/helpers/wizard-state";
import { clearPendingCartLines } from "@/modules/bundle-wizard/helpers/pending-cart";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { queryKeys } from "@/shared/query/query-keys";
import { freshQueryOptions } from "@/shared/query/query-cache";
import { WIZARD_PRODUCT_PICKER_PAGE_SIZE } from "../wizard-product-picker/wizard-product-picker.constants";
import {
  flattenProductPickerPages,
  getNextProductPickerPage,
} from "../wizard-product-picker/wizard-product-picker.helpers";
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
  const [pickerImages, setPickerImages] = useState<Record<string, string>>({});
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

  const imagesByProductId = useMemo(
    () => buildComponentImages(template.items, pickerImages),
    [pickerImages, template.items],
  );

  const productsQuery = useInfiniteQuery({
    queryKey: queryKeys.wizard.productSearch(searchQuery),
    queryFn: async ({ pageParam }) => {
      const result = await listPublicProductsAction({
        page: pageParam,
        pageSize: WIZARD_PRODUCT_PICKER_PAGE_SIZE,
        search: searchQuery || undefined,
        sort: "name_asc",
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    initialPageParam: 1,
    getNextPageParam: getNextProductPickerPage,
  });

  const {
    data: productsData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = productsQuery;

  const pickerProducts = useMemo(
    () => flattenProductPickerPages(productsData?.pages),
    [productsData?.pages],
  );

  const handleLoadMoreProducts = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const previewQuery = useQuery({
    ...freshQueryOptions,
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

  const handleRemove = (productId: string) => {
    setComponents((current) => removeComponent(current, productId));
  };

  const handleAdd = (product: {
    id: string;
    name: string;
    imageUrl: string | null;
  }) => {
    setPickerLabels((current) => ({ ...current, [product.id]: product.name }));
    setPickerImages((current) => ({
      ...current,
      [product.id]: product.imageUrl ?? CATALOG_PLACEHOLDER_IMAGE,
    }));
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
      products={pickerProducts}
      selectedProductIds={selectedProductIds}
      labelsByProductId={labelsByProductId}
      imagesByProductId={imagesByProductId}
      lineTotal={previewQuery.data?.lineTotal ?? null}
      stockCheck={previewQuery.data?.stockCheck ?? null}
      isValid={isValid}
      canRemove={canRemoveComponent(components)}
      canAdd={canAddComponent(components)}
      isPreviewLoading={previewQuery.isFetching}
      isPreviewError={previewQuery.isError}
      isProductsLoading={isProductsLoading}
      isProductsFetchingNextPage={isFetchingNextPage}
      hasMoreProducts={hasNextPage ?? false}
      isProductsError={isProductsError}
      isAddingToCart={isAddingToCart}
      labels={{
        back: t("back"),
        title: t("title"),
        personCount: t("personCount", { count: template.personCount }),
        addToCart: t("addToCart"),
        addToCartLoading: t("addToCartLoading"),
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
          progressLabel: t("componentList.progressLabel", {
            current: components.length,
            max: BUNDLE_CUSTOMIZATION_MAX,
          }),
          formatQuantityBreakdown: ({ perPerson, surprises, total }) =>
            t("componentList.quantityBreakdown", {
              perPerson,
              surprises,
              total,
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
          loadingMore: t("picker.loadingMore"),
          error: tCommon("error"),
          retry: tCommon("retry"),
          expand: t("picker.expand"),
          collapse: t("picker.collapse"),
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
          checking: t("stock.checking"),
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
        void refetchProducts();
      }}
      onLoadMoreProducts={handleLoadMoreProducts}
      onPreviewRetry={() => {
        void previewQuery.refetch();
      }}
      onAddToCart={handleAddToCart}
    />
  );
}
