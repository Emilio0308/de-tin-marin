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
  BUNDLE_LINE_QUANTITY_MAX,
  BUNDLE_LINE_QUANTITY_MIN,
  clampBundleLineQuantity,
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
  setComponentQuantityPerUnit,
} from "@/modules/bundle-wizard/helpers/wizard-state";
import { clearPendingCartLines } from "@/modules/bundle-wizard/helpers/pending-cart";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { storeFeatures } from "@/config/store";
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
  const bounds = useMemo(
    () => ({
      minProducts: template.customizationMinProducts,
      maxProducts: template.customizationMaxProducts,
    }),
    [template.customizationMaxProducts, template.customizationMinProducts],
  );
  const [components, setComponents] = useState<CustomizeBundleComponent[]>(
    () => template.initialComponents,
  );
  const [quantity, setQuantity] = useState(() =>
    clampBundleLineQuantity(template.personCount),
  );
  const [debouncedComponents, setDebouncedComponents] =
    useState<CustomizeBundleComponent[]>(components);
  const [debouncedQuantity, setDebouncedQuantity] = useState(quantity);
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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuantity(quantity);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [quantity]);

  const validation = useMemo(
    () => validateBundleCustomization(components, bounds),
    [bounds, components],
  );
  const isQuantityValid =
    quantity >= BUNDLE_LINE_QUANTITY_MIN &&
    quantity <= BUNDLE_LINE_QUANTITY_MAX;
  const isValid = validation.ok && isQuantityValid;

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

  const isDebouncedQuantityValid =
    debouncedQuantity >= BUNDLE_LINE_QUANTITY_MIN &&
    debouncedQuantity <= BUNDLE_LINE_QUANTITY_MAX;

  const previewQuery = useQuery({
    ...freshQueryOptions,
    queryKey: queryKeys.wizard.preview(
      template.bundleId,
      debouncedQuantity,
      debouncedComponents,
    ),
    queryFn: async () => {
      const result = await previewBundleLineAction({
        bundleId: template.bundleId,
        quantity: debouncedQuantity,
        components: debouncedComponents,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled:
      validateBundleCustomization(debouncedComponents, bounds).ok &&
      isDebouncedQuantityValid,
  });

  const unitPricesByProductId = useMemo(() => {
    const componentsFromPreview = previewQuery.data?.line.components ?? [];
    return Object.fromEntries(
      componentsFromPreview.map((component) => [
        component.productId,
        component.unitPrice,
      ]),
    );
  }, [previewQuery.data?.line.components]);

  const handleRemove = (productId: string) => {
    setComponents((current) => removeComponent(current, productId, bounds));
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
    setComponents((current) => addComponent(current, product.id, bounds));
  };

  const handleQuantityPerUnitChange = (
    productId: string,
    quantityPerUnit: number,
  ) => {
    if (!storeFeatures.enableUnitsPerPerson) return;
    setComponents((current) =>
      setComponentQuantityPerUnit(current, productId, quantityPerUnit),
    );
  };

  const handleQuantityChange = (next: number) => {
    setQuantity(clampBundleLineQuantity(next));
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
      quantity={quantity}
      minQuantity={BUNDLE_LINE_QUANTITY_MIN}
      maxQuantity={BUNDLE_LINE_QUANTITY_MAX}
      searchValue={searchDraft}
      products={pickerProducts}
      selectedProductIds={selectedProductIds}
      labelsByProductId={labelsByProductId}
      imagesByProductId={imagesByProductId}
      unitPricesByProductId={unitPricesByProductId}
      lineTotal={previewQuery.data?.normalizedLineTotal ?? null}
      stockCheck={previewQuery.data?.stockCheck ?? null}
      isValid={isValid}
      canRemove={canRemoveComponent(components, bounds)}
      canAdd={canAddComponent(components, bounds)}
      enableUnitsPerPerson={storeFeatures.enableUnitsPerPerson}
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
        surpriseQuantity: t("surpriseQuantity"),
        surpriseQuantityHint: t("surpriseQuantityHint", {
          min: BUNDLE_LINE_QUANTITY_MIN,
          max: BUNDLE_LINE_QUANTITY_MAX,
        }),
        decreaseQuantity: t("decreaseQuantity"),
        increaseQuantity: t("increaseQuantity"),
        addToCart: t("addToCart"),
        addToCartLoading: t("addToCartLoading"),
        validationMin: t("validation.min", { min: bounds.minProducts }),
        validationMax: t("validation.max", { max: bounds.maxProducts }),
        validationDuplicate: t("validation.duplicate"),
        picker: {
          title: t("picker.title"),
          searchPlaceholder: t("picker.searchPlaceholder"),
          searchAriaLabel: t("picker.searchAriaLabel"),
          add: t("picker.add"),
          empty: t("picker.empty"),
          maxReached: t("picker.maxReached", { max: bounds.maxProducts }),
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
      onQuantityPerUnitChange={handleQuantityPerUnitChange}
      onQuantityChange={handleQuantityChange}
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
