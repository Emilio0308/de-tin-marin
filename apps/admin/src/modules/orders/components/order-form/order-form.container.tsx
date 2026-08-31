"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getBundleAction } from "@/modules/catalog/actions/get-bundle";
import { getPackAction } from "@/modules/catalog/actions/get-pack";
import { listBundlesPageAction } from "@/modules/catalog/actions/list-bundles";
import { listPacksPageAction } from "@/modules/catalog/actions/list-packs";
import {
  listDeliveryZonesAction,
  resolveDeliveryFeeAction,
} from "@/modules/delivery/actions/delivery.actions";
import { listPickupPointsAction } from "@/modules/delivery/actions/pickup-point.actions";
import { listCourierDepartmentsAction } from "@/modules/delivery/actions/courier.actions";
import { createOrderAction } from "@/modules/orders/actions/create-order";
import { previewAdminBundleLineAction } from "@/modules/orders/actions/preview-admin-bundle-line";
import { previewOrderCartAction } from "@/modules/orders/actions/preview-order-cart";
import { freshQueryOptions } from "@/shared/query/query-cache";
import { queryKeys } from "@/shared/query/query-keys";
import {
  validateBundleCustomization,
  resolveBundleCustomizationBounds,
} from "@de-tin-marin/validations/customize-bundle";
import { OrderForm } from "./order-form";
import {
  addBundleComponent,
  buildInitialBundleComponents,
} from "./order-form-bundle.helpers";
import type { CartCompositionItem } from "./order-form-cart-lines";
import {
  clampOrderFormPackQuantity,
  mergeOrAddProductLine,
  resolveOrderFormPackBounds,
  updateProductLineDualQuantity,
} from "./order-form-product.helpers";
import {
  estimateOrderFormLineTotal,
  previewOrderTotals,
} from "./order-form.helpers";
import {
  emptyOrderFormValues,
  type OrderFormBundleDraft,
  type OrderFormFieldErrors,
  type OrderFormLabels,
  type OrderFormValues,
  type ProductOption,
} from "./order-form.types";
import {
  mapOrderFormFieldErrorKeys,
  sanitizeOrderFormValues,
  validateCreateOrderField,
  validateCreateOrderForm,
  type CustomerDeliveryFieldPath,
  type OrderFormFieldErrorKeys,
  type OrderFormValidationKey,
} from "../../helpers/order-form-validation";

type PackDetailCache = {
  components: Array<{
    productId: string;
    packageQuantity: number;
    unitQuantity: number;
  }>;
  composition: CartCompositionItem[];
};

const ORDER_FORM_VALIDATION_KEYS = new Set<OrderFormValidationKey>([
  "requiredName",
  "requiredLastName",
  "requiredPhone",
  "invalidEmail",
  "requiredDeliveryAddress",
  "requiredRecipient",
  "requiredLine1",
  "requiredDistrict",
  "requiredCity",
  "requiredProvince",
  "requiredDeliveryPhone",
  "requiredLines",
  "invalidName",
  "tooShortName",
  "invalidPhone",
  "tooShortAddress",
  "invalidField",
  "reviewForm",
]);

function isOrderFormValidationKey(
  value: string,
): value is OrderFormValidationKey {
  return ORDER_FORM_VALIDATION_KEYS.has(value as OrderFormValidationKey);
}

function toFieldErrorKeys(
  value: Record<string, string>,
): OrderFormFieldErrorKeys {
  const keys: OrderFormFieldErrorKeys = {};
  for (const [path, maybeKey] of Object.entries(value)) {
    if (isOrderFormValidationKey(maybeKey)) {
      keys[path] = maybeKey;
    }
  }
  return keys;
}

export function OrderFormContainer() {
  const router = useRouter();
  const t = useTranslations("orders");
  const tDashboard = useTranslations("dashboard.orderStatus");

  function translateValidation(key: OrderFormValidationKey): string {
    return t(`form.validation.${key}`);
  }

  function translateFieldErrors(
    keys: OrderFormFieldErrorKeys,
  ): OrderFormFieldErrors {
    return mapOrderFormFieldErrorKeys(keys, translateValidation);
  }

  function orderErrorMessage(result: {
    error: string;
    message?: string;
  }): string {
    switch (result.error) {
      case "VALIDATION":
        return t("form.errors.validation");
      case "PRODUCT_NOT_FOUND":
        return t("form.errors.productNotFound");
      case "BUNDLE_NOT_FOUND":
        return t("form.errors.bundleNotFound");
      case "PACK_NOT_FOUND":
        return t("form.errors.packNotFound");
      case "DUPLICATE_PRODUCT_IN_BUNDLE":
        return t("form.errors.duplicateProductInBundle");
      case "INVALID_BUNDLE_CUSTOMIZATION":
        return t("form.errors.invalidBundleCustomization");
      case "UNAUTHORIZED":
        return t("form.errors.unauthorized");
      case "FORBIDDEN":
        return t("form.errors.forbidden");
      default:
        return result.message
          ? t("form.errors.unexpectedWithMessage", {
              message: result.message,
            })
          : t("form.errors.unexpected");
    }
  }
  const [values, setValues] = useState<OrderFormValues>(emptyOrderFormValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<OrderFormFieldErrors>({});
  const touchedCustomerDeliveryFields = useRef(
    new Set<CustomerDeliveryFieldPath>(),
  );
  const [bundleDraft, setBundleDraft] = useState<OrderFormBundleDraft | null>(
    null,
  );
  const [bundleDraftLoading, setBundleDraftLoading] = useState(false);
  const [debouncedBundlePreview, setDebouncedBundlePreview] = useState<{
    bundleId: string;
    quantity: number;
    components: OrderFormBundleDraft["components"];
  } | null>(null);

  const labels = useMemo<OrderFormLabels>(
    () => ({
      contactSection: t("form.contactSection"),
      deliverySection: t("form.deliverySection"),
      cartSection: t("form.cartSection"),
      totalsSection: t("form.totalsSection"),
      name: t("form.name"),
      lastName: t("form.lastName"),
      phone: t("form.phone"),
      email: t("form.email"),
      delivery: t("form.delivery"),
      pickup: t("form.pickup"),
      pickupPoint: t("form.pickupPoint"),
      courier: t("form.courier"),
      selectPickupPoint: t("form.selectPickupPoint"),
      courierDepartment: t("form.courierDepartment"),
      selectCourierDepartment: t("form.selectCourierDepartment"),
      courierProvince: t("form.courierProvince"),
      selectCourierProvince: t("form.selectCourierProvince"),
      courierDni: t("form.courierDni"),
      courierFullName: t("form.courierFullName"),
      courierAgencyAddress: t("form.courierAgencyAddress"),
      recipientName: t("form.recipientName"),
      address: t("form.address"),
      district: t("form.district"),
      city: t("form.city"),
      province: t("form.province"),
      reference: t("form.reference"),
      deliveryPhone: t("form.deliveryPhone"),
      selectDistrict: t("form.selectDistrict"),
      product: t("form.product"),
      selectProduct: t("form.selectProduct"),
      quantity: t("form.quantity"),
      addProduct: t("form.addProduct"),
      surprise: t("form.surprise"),
      selectSurprise: t("form.selectSurprise"),
      surpriseQuantity: t("form.surpriseQuantity"),
      addSurprise: t("form.addSurprise"),
      removeLine: t("form.removeLine"),
      emptyLines: t("form.emptyLines"),
      shipping: t("form.shipping"),
      shippingHint: t("form.shippingHint"),
      discount: t("form.discount"),
      surcharge: t("form.surcharge"),
      finalPrice: t("form.finalPrice"),
      finalPriceHint: t("form.finalPriceHint"),
      tabFinalPrice: t("form.tabFinalPrice"),
      tabAdjustments: t("form.tabAdjustments"),
      subtotal: t("form.subtotal"),
      total: t("form.total"),
      createOrder: t("form.createOrder"),
      creating: t("form.creating"),
      productLine: t("form.productLine"),
      surpriseLine: t("form.surpriseLine"),
      formatComponents: (count) => t("form.formatComponents", { count }),
      viewComponents: (count) => t("form.viewComponents", { count }),
      formatPackComponentQty: (packages, units) =>
        units > 0
          ? t("form.formatPackComponentQtyWithUnits", { packages, units })
          : t("form.formatPackComponentPackages", { packages }),
      formatProductDualQty: (packages, units) =>
        units > 0
          ? t("form.formatPackComponentQtyWithUnits", { packages, units })
          : t("form.formatPackComponentPackages", { packages }),
      formatQuantityLabel: (quantity) => t("form.quantityLabel", { quantity }),
      packagesLabel: t("form.packagesLabel"),
      unitsLabel: t("form.unitsLabel"),
      quantityBounds: (min, max) => t("form.quantityBounds", { min, max }),
      configureSurprise: t("form.configureSurprise"),
      addingSurprise: t("form.addingSurprise"),
      tabProducts: t("form.tabProducts"),
      tabCombos: t("form.tabCombos"),
      tabSurprises: t("form.tabSurprises"),
      selectProductFirst: t("form.selectProductFirst"),
      productOutOfStock: (min, available) =>
        t("form.productOutOfStock", { min, available }),
      customizeTitle: t("form.customizeTitle"),
      customizeSubtitle: (min, max) =>
        t("form.customizeSubtitle", { min, max }),
      candyCount: t("form.candyCount"),
      customizationProgress: t("form.customizationProgress"),
      minCandiesReached: (min) => t("form.minCandiesReached", { min }),
      maxCandiesReached: (max) => t("form.maxCandiesReached", { max }),
      removeCandy: t("form.removeCandy"),
      addCandy: t("form.addCandy"),
      selectCandy: t("form.selectCandy"),
      confirmSurprise: t("form.confirmSurprise"),
      cancelCustomize: t("form.cancelCustomize"),
      validationMinCandies: (min) => t("form.validationMinCandies", { min }),
      validationMaxCandies: (max) => t("form.validationMaxCandies", { max }),
      editSurprise: t("form.editSurprise"),
      candiesSubtotal: t("form.candiesSubtotal"),
      containerSubtotal: t("form.containerSubtotal"),
      containerCostHint: (unitPrice, quantity) =>
        t("form.containerCostHint", { unitPrice, quantity }),
      unitPriceSuffix: t("form.unitPriceSuffix"),
      customizeTotal: t("form.customizeTotal"),
      formatBundleTheoreticalTotal: (price) =>
        t("form.bundleTheoreticalTotal", { price }),
      formatBundlePerSurprisePrice: (chargeable, theoretical) =>
        t("form.bundlePerSurprisePrice", { chargeable, theoretical }),
      addCandyAction: t("form.addCandyAction"),
      candyAlreadyAdded: t("form.candyAlreadyAdded"),
      searchCandies: t("form.searchCandies"),
      searchCandiesPlaceholder: t("form.searchCandiesPlaceholder"),
      expandPicker: t("form.expandPicker"),
      collapsePicker: t("form.collapsePicker"),
      templatePersonCount: (count) => t("form.templatePersonCount", { count }),
      priceCalculating: t("form.priceCalculating"),
      surpriseQuantityHint: t("form.surpriseQuantityHint"),
      combo: t("form.combo"),
      selectCombo: t("form.selectCombo"),
      selectComboFirst: t("form.selectComboFirst"),
      addCombo: t("form.addCombo"),
      comboLine: t("form.comboLine"),
      packOutOfStock: (available) => t("form.packOutOfStock", { available }),
      packStockShortages: (names) => t("form.packStockShortages", { names }),
    }),
    [t],
  );

  const [pickedProducts, setPickedProducts] = useState<ProductOption[]>([]);
  const [packDetailsById, setPackDetailsById] = useState<
    Record<string, PackDetailCache>
  >({});

  const bundlesQuery = useQuery({
    queryKey: queryKeys.catalog.bundlesPage({
      page: 1,
      pageSize: 50,
      status: "active",
    }),
    queryFn: async () => {
      const result = await listBundlesPageAction({
        page: 1,
        pageSize: 50,
        status: "active",
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const packsQuery = useQuery({
    queryKey: queryKeys.catalog.packsPage({
      page: 1,
      pageSize: 50,
      status: "active",
    }),
    queryFn: async () => {
      const result = await listPacksPageAction({
        page: 1,
        pageSize: 50,
        status: "active",
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const deliveryZonesQuery = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const result = await listDeliveryZonesAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const pickupPointsQuery = useQuery({
    queryKey: ["pickup-points"],
    queryFn: async () => {
      const result = await listPickupPointsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const pickupPointOptions = useMemo(
    () =>
      (pickupPointsQuery.data ?? []).map((point) => ({
        id: point.id,
        name: point.name,
        lat: point.lat,
        lng: point.lng,
        fee: point.fee,
        isActive: point.isActive,
      })),
    [pickupPointsQuery.data],
  );

  const courierDepartmentsQuery = useQuery({
    queryKey: ["courier-departments"],
    queryFn: async () => {
      const result = await listCourierDepartmentsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const courierDepartmentOptions = useMemo(
    () =>
      (courierDepartmentsQuery.data ?? [])
        .filter((department) => department.isActive)
        .map((department) => ({
          id: department.id,
          name: department.name,
          provinces: department.provinces,
        })),
    [courierDepartmentsQuery.data],
  );

  const productOptions = pickedProducts;

  function handleEnsureProductOption(product: ProductOption) {
    setPickedProducts((current) => {
      if (current.some((item) => item.id === product.id)) return current;
      return [...current, product];
    });
  }

  const bundleOptions = useMemo(
    () =>
      (bundlesQuery.data?.items ?? []).map((bundle) => ({
        id: bundle.id,
        name: bundle.name,
        containerId: bundle.containerId,
        containerName: bundle.containerName,
        containerNetPrice: bundle.containerNetPrice,
        templateQuantity: bundle.quantity,
      })),
    [bundlesQuery.data],
  );

  const packOptions = useMemo(
    () =>
      (packsQuery.data?.items ?? []).map((pack) => ({
        id: pack.id,
        name: pack.name,
        sku: pack.sku,
        finalPrice: pack.finalPrice,
        availableQuantity: pack.availableQuantity,
        stockShortages: pack.stockShortages,
        purchaseMinQuantity: pack.purchaseMinQuantity,
        purchaseMaxQuantity: pack.purchaseMaxQuantity,
        itemCount: pack.itemCount,
      })),
    [packsQuery.data],
  );

  const packsById = useMemo(
    () =>
      new Map(
        packOptions.map((pack) => [
          pack.id,
          {
            id: pack.id,
            sku: pack.sku,
            name: pack.name,
            unitPrice: pack.finalPrice,
            components: packDetailsById[pack.id]?.components ?? [],
          },
        ]),
      ),
    [packOptions, packDetailsById],
  );

  const packCompositionsById = useMemo(() => {
    const map = new Map<string, CartCompositionItem[]>();
    for (const [packId, detail] of Object.entries(packDetailsById)) {
      map.set(packId, detail.composition);
    }
    return map;
  }, [packDetailsById]);

  const bundlesById = useMemo(
    () =>
      new Map(
        bundleOptions.map((bundle) => [
          bundle.id,
          {
            name: bundle.name,
            container: {
              containerId: bundle.containerId,
              sku: "",
              name: bundle.containerName,
              unitPrice: bundle.containerNetPrice,
            },
          },
        ]),
      ),
    [bundleOptions],
  );

  useEffect(() => {
    void (async () => {
      const feeInput =
        values.fulfillment.method === "courier"
          ? {
              method: "courier" as const,
              departmentId: values.fulfillment.courierDepartmentId || undefined,
              provinceSlug: values.fulfillment.courierProvinceSlug || undefined,
            }
          : {
              method: values.fulfillment.method,
              district: values.fulfillment.deliveryAddress.district,
              pickupPointId:
                values.fulfillment.method === "pickup_point"
                  ? values.fulfillment.pickupPointId || undefined
                  : undefined,
            };
      const result = await resolveDeliveryFeeAction(feeInput);
      if (!result.ok) return;
      setValues((current) =>
        current.shippingTotal === result.fee
          ? current
          : { ...current, shippingTotal: result.fee },
      );
    })();
  }, [
    values.fulfillment.method,
    values.fulfillment.deliveryAddress.district,
    values.fulfillment.pickupPointId,
    values.fulfillment.courierDepartmentId,
    values.fulfillment.courierProvinceSlug,
  ]);

  useEffect(() => {
    if (!bundleDraft) {
      setDebouncedBundlePreview(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      setDebouncedBundlePreview({
        bundleId: bundleDraft.bundleId,
        quantity: bundleDraft.quantity,
        components: bundleDraft.components,
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [bundleDraft]);

  const bundlePreviewQuery = useQuery({
    ...freshQueryOptions,
    queryKey: [
      "admin-order",
      "bundle-preview",
      debouncedBundlePreview?.bundleId,
      debouncedBundlePreview?.quantity,
      debouncedBundlePreview?.components,
    ],
    queryFn: async () => {
      const result = await previewAdminBundleLineAction(
        debouncedBundlePreview!,
      );
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled:
      debouncedBundlePreview !== null &&
      bundleDraft !== null &&
      validateBundleCustomization(debouncedBundlePreview.components, {
        minProducts: bundleDraft.customizationMinProducts,
        maxProducts: bundleDraft.customizationMaxProducts,
      }).ok,
  });

  const cartPreviewPayload = useMemo(
    () => ({
      lines: values.lines.map((line) => {
        if (line.type === "product") return line;
        if (line.type === "pack") {
          return {
            type: "pack" as const,
            packId: line.packId,
            quantity: line.quantity,
          };
        }
        return {
          type: "bundle" as const,
          bundleId: line.bundleId,
          quantity: line.quantity,
          components: line.components,
        };
      }),
      shippingTotal: values.shippingTotal,
      discountTotal: values.discountTotal,
      surchargeTotal: values.surchargeTotal,
    }),
    [
      values.discountTotal,
      values.surchargeTotal,
      values.lines,
      values.shippingTotal,
    ],
  );

  const cartPreviewQuery = useQuery({
    ...freshQueryOptions,
    queryKey: [
      "admin-order",
      "cart-preview",
      cartPreviewPayload.lines,
      cartPreviewPayload.shippingTotal,
      cartPreviewPayload.discountTotal,
      cartPreviewPayload.surchargeTotal,
    ],
    queryFn: async () => {
      const result = await previewOrderCartAction(cartPreviewPayload);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: values.lines.length > 0,
  });

  const fallbackTotals = previewOrderTotals(
    values,
    productOptions,
    bundlesById,
    packsById,
  );

  const totals = cartPreviewQuery.data ?? fallbackTotals;

  const bundlePriceSummary = bundlePreviewQuery.data
    ? {
        itemsSubtotal: bundlePreviewQuery.data.itemsSubtotal,
        containerSubtotal: bundlePreviewQuery.data.containerSubtotal,
        total: bundlePreviewQuery.data.normalizedLineTotal,
        rawTotal: bundlePreviewQuery.data.lineTotal,
      }
    : null;

  const productsById = useMemo(
    () => new Map(productOptions.map((product) => [product.id, product])),
    [productOptions],
  );

  function getLineTotal(index: number): number | null {
    const serverTotal = cartPreviewQuery.data?.lineTotals[index];
    if (serverTotal !== undefined) return serverTotal;

    const line = values.lines[index];
    if (!line) return null;
    return estimateOrderFormLineTotal(
      line,
      productOptions,
      bundlesById,
      packsById,
    );
  }

  function handleAddProductLine(
    productId: string,
    packageQuantity: number,
    unitQuantity: number,
  ) {
    const product = productsById.get(productId);
    if (!product) return;

    setValues((current) => ({
      ...current,
      lines: mergeOrAddProductLine(
        current.lines,
        productId,
        packageQuantity,
        unitQuantity,
        product,
      ),
    }));
  }

  function handleUpdateProductLineQuantity(
    index: number,
    packageQuantity: number,
    unitQuantity: number,
  ) {
    const line = values.lines[index];
    if (!line || line.type !== "product") return;

    const product = productsById.get(line.productId);
    if (!product) return;

    setValues((current) => ({
      ...current,
      lines: updateProductLineDualQuantity(
        current.lines,
        index,
        packageQuantity,
        unitQuantity,
        product,
      ),
    }));
  }

  async function ensurePackDetails(
    packId: string,
  ): Promise<PackDetailCache | null> {
    const cached = packDetailsById[packId];
    if (cached) return cached;

    const result = await getPackAction(packId);
    if (!result.ok) {
      setError(t("form.loadPackCompositionError"));
      return null;
    }

    const detail: PackDetailCache = {
      components: result.data.items.map((item) => ({
        productId: item.productId,
        packageQuantity: item.packageQuantity,
        unitQuantity: item.unitQuantity,
      })),
      composition: result.data.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantityLabel:
          item.unitQuantity > 0
            ? t("form.formatPackComponentQtyWithUnits", {
                packages: item.packageQuantity,
                units: item.unitQuantity,
              })
            : t("form.formatPackComponentPackages", {
                packages: item.packageQuantity,
              }),
      })),
    };

    setPackDetailsById((current) => ({ ...current, [packId]: detail }));
    return detail;
  }

  function handleAddPackLine(packId: string, quantity: number) {
    const pack = packOptions.find((item) => item.id === packId);
    if (!pack) return;
    const bounds = resolveOrderFormPackBounds(pack);
    if (!bounds.purchasable) return;
    const qty = clampOrderFormPackQuantity(quantity, pack);

    void (async () => {
      await ensurePackDetails(packId);
      setValues((current) => ({
        ...current,
        lines: [...current.lines, { type: "pack", packId, quantity: qty }],
      }));
    })();
  }

  async function loadBundleDraft(
    bundleId: string,
    options?: {
      components?: OrderFormBundleDraft["components"];
      quantity?: number;
      editingLineIndex?: number | null;
    },
  ) {
    setBundleDraftLoading(true);
    setError(null);

    try {
      const result = await getBundleAction(bundleId);
      if (!result.ok) {
        setError(t("form.loadBundleTemplateError"));
        return;
      }

      const bundleOption = bundleOptions.find(
        (bundle) => bundle.id === bundleId,
      );
      const activeItems = result.data.items.filter((item) => item.isActive);
      const bounds = resolveBundleCustomizationBounds({
        customizationMinProducts: result.data.customizationMinProducts,
        customizationMaxProducts: result.data.customizationMaxProducts,
      });
      const templateProducts: ProductOption[] = activeItems.map((item) => ({
        id: item.productId,
        name: item.productName,
        sku: item.sku,
        finalPrice: item.netPrice,
        finalUnitPrice: item.unitNetPrice,
        imageUrl: item.imageUrl,
        productType: item.productType,
        itemsPerPackage: item.itemsPerPackage,
        stockTotalBaseUnits: item.stockTotalBaseUnits,
        purchaseMinQuantity: 1,
        purchaseMaxQuantity: 9999,
      }));

      setPickedProducts((current) => {
        const byId = new Map(current.map((product) => [product.id, product]));
        for (const product of templateProducts) {
          byId.set(product.id, product);
        }
        return [...byId.values()];
      });

      setBundleDraft({
        bundleId,
        bundleName: result.data.name,
        containerName: bundleOption?.containerName ?? result.data.containerName,
        containerNetPrice:
          bundleOption?.containerNetPrice ?? result.data.containerNetPrice,
        templateQuantity: result.data.quantity,
        customizationMinProducts: bounds.minProducts,
        customizationMaxProducts: bounds.maxProducts,
        templateItems: activeItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
        })),
        components:
          options?.components ??
          buildInitialBundleComponents(
            activeItems.map((item) => ({
              productId: item.productId,
              unitsPerPerson: item.unitsPerPerson,
              isActive: true,
            })),
            bounds,
          ),
        quantity: options?.quantity ?? result.data.quantity,
        editingLineIndex: options?.editingLineIndex ?? null,
      });
    } finally {
      setBundleDraftLoading(false);
    }
  }

  function handleAddBundleCandy(product: ProductOption) {
    handleEnsureProductOption(product);
    setBundleDraft((current) => {
      if (!current) return current;
      const bounds = {
        minProducts: current.customizationMinProducts,
        maxProducts: current.customizationMaxProducts,
      };
      return {
        ...current,
        components: addBundleComponent(current.components, product.id, bounds),
      };
    });
  }

  function handleStartBundleDraft(bundleId: string) {
    void loadBundleDraft(bundleId);
  }

  async function handleAddBundleAsTemplate(bundleId: string) {
    setBundleDraftLoading(true);
    setError(null);

    try {
      const result = await getBundleAction(bundleId);
      if (!result.ok) {
        setError(t("form.loadBundleTemplateError"));
        return;
      }

      const activeItems = result.data.items.filter((item) => item.isActive);
      const bounds = resolveBundleCustomizationBounds({
        customizationMinProducts: result.data.customizationMinProducts,
        customizationMaxProducts: result.data.customizationMaxProducts,
      });
      const templateProducts: ProductOption[] = activeItems.map((item) => ({
        id: item.productId,
        name: item.productName,
        sku: item.sku,
        finalPrice: item.netPrice,
        finalUnitPrice: item.unitNetPrice,
        imageUrl: item.imageUrl,
        productType: item.productType,
        itemsPerPackage: item.itemsPerPackage,
        stockTotalBaseUnits: item.stockTotalBaseUnits,
        purchaseMinQuantity: 1,
        purchaseMaxQuantity: 9999,
      }));

      setPickedProducts((current) => {
        const byId = new Map(current.map((product) => [product.id, product]));
        for (const product of templateProducts) {
          byId.set(product.id, product);
        }
        return [...byId.values()];
      });

      const components = buildInitialBundleComponents(
        activeItems.map((item) => ({
          productId: item.productId,
          unitsPerPerson: item.unitsPerPerson,
          isActive: true,
        })),
        bounds,
      );
      const validation = validateBundleCustomization(components, bounds);
      if (!validation.ok) {
        setError(t("form.bundleTemplateInvalid"));
        return;
      }

      setValues((current) => ({
        ...current,
        lines: [
          ...current.lines,
          {
            type: "bundle" as const,
            bundleId,
            quantity: result.data.quantity,
            components: validation.data,
          },
        ],
      }));
    } finally {
      setBundleDraftLoading(false);
    }
  }

  function handleEditBundleLine(index: number) {
    const line = values.lines[index];
    if (!line || line.type !== "bundle") return;

    void loadBundleDraft(line.bundleId, {
      components: line.components,
      quantity: line.quantity,
      editingLineIndex: index,
    });
  }

  function handleConfirmBundleDraft() {
    if (!bundleDraft) return;

    const validation = validateBundleCustomization(bundleDraft.components, {
      minProducts: bundleDraft.customizationMinProducts,
      maxProducts: bundleDraft.customizationMaxProducts,
    });
    if (!validation.ok) {
      setError(t("form.bundleCustomizationInvalid"));
      return;
    }

    const nextLine = {
      type: "bundle" as const,
      bundleId: bundleDraft.bundleId,
      quantity: bundleDraft.quantity,
      components: validation.data,
    };

    setValues((current) => {
      if (bundleDraft.editingLineIndex !== null) {
        return {
          ...current,
          lines: current.lines.map((line, index) =>
            index === bundleDraft.editingLineIndex ? nextLine : line,
          ),
        };
      }

      return {
        ...current,
        lines: [...current.lines, nextLine],
      };
    });

    setBundleDraft(null);
  }

  function handleRemoveLine(index: number) {
    setValues((current) => ({
      ...current,
      lines: current.lines.filter((_, lineIndex) => lineIndex !== index),
    }));
  }

  function handleSubmit() {
    const validation = validateCreateOrderForm(
      values,
      pickupPointOptions,
      courierDepartmentOptions,
    );
    if (!validation.ok) {
      setFieldErrors(translateFieldErrors(validation.fieldErrorKeys));
      setError(translateValidation(validation.formErrorKey));
      return;
    }

    void (async () => {
      setSubmitting(true);
      setError(null);
      setFieldErrors({});

      try {
        const result = await createOrderAction(validation.payload);
        if (!result.ok) {
          if (
            result.error === "VALIDATION" &&
            "fieldErrors" in result &&
            result.fieldErrors &&
            typeof result.fieldErrors === "object"
          ) {
            setFieldErrors(
              translateFieldErrors(toFieldErrorKeys(result.fieldErrors)),
            );
          }
          setError(orderErrorMessage(result));
          return;
        }

        startTransition(() => {
          router.push(`/orders/${result.data.id}`);
        });
      } catch {
        setError(t("form.errors.unexpected"));
      } finally {
        setSubmitting(false);
      }
    })();
  }

  function updateTouchedFieldErrors(nextValues: OrderFormValues) {
    if (touchedCustomerDeliveryFields.current.size === 0) return;

    setFieldErrors((current) => {
      const next = { ...current };
      for (const path of touchedCustomerDeliveryFields.current) {
        const key = validateCreateOrderField(nextValues, path);
        if (key) {
          next[path] = translateValidation(key);
        } else {
          delete next[path];
        }
      }
      return next;
    });
  }

  function handleCustomerDeliveryFieldBlur(path: CustomerDeliveryFieldPath) {
    touchedCustomerDeliveryFields.current.add(path);
    const key = validateCreateOrderField(values, path);

    setFieldErrors((current) => {
      const next = { ...current };
      if (key) {
        next[path] = translateValidation(key);
      } else {
        delete next[path];
      }
      return next;
    });
  }

  if (
    bundlesQuery.isLoading ||
    packsQuery.isLoading ||
    deliveryZonesQuery.isLoading
  ) {
    return (
      <p className="text-on-surface-variant p-8 text-sm">
        {t("form.loadingCatalog")}
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/orders"
          className="text-secondary font-label text-label-bold inline-flex w-fit items-center gap-2 text-sm hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("form.back")}
        </Link>
        <nav
          className="font-label text-on-surface-variant flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide"
          aria-label="Breadcrumb"
        >
          <span>{t("list.title")}</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
          <span className="text-primary">{t("form.title")}</span>
        </nav>
        <div className="space-y-2">
          <h1 className="font-display text-on-surface text-[32px] font-extrabold leading-10 tracking-tight lg:text-[40px]">
            {t("form.title")}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant">
            {t("form.subtitle")}
          </p>
          <span className="font-label text-label-bold inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">
            {tDashboard("pending_payment")}
          </span>
        </div>
      </div>
      <OrderForm
        values={values}
        products={productOptions}
        bundles={bundleOptions}
        packs={packOptions}
        packCompositionsById={packCompositionsById}
        deliveryDistricts={(deliveryZonesQuery.data ?? [])
          .filter((zone) => zone.isActive)
          .map((zone) => zone.district)}
        pickupPoints={pickupPointOptions}
        courierDepartments={courierDepartmentOptions}
        bundleDraft={bundleDraft}
        bundleDraftLoading={bundleDraftLoading}
        bundlePriceSummary={bundlePriceSummary}
        bundleUnitPricesByProductId={
          bundlePreviewQuery.data?.unitPricesByProductId ?? {}
        }
        isBundlePricePending={
          bundleDraft !== null &&
          (bundlePreviewQuery.isLoading || bundlePreviewQuery.isFetching)
        }
        totals={totals}
        submitting={submitting}
        error={error}
        fieldErrors={fieldErrors}
        labels={labels}
        onChange={(next) => {
          const sanitized = sanitizeOrderFormValues(next);
          setError(null);
          setValues(sanitized);
          updateTouchedFieldErrors(sanitized);
        }}
        onFieldBlur={(path) =>
          handleCustomerDeliveryFieldBlur(path as CustomerDeliveryFieldPath)
        }
        onEnsureProductOption={handleEnsureProductOption}
        onAddProductLine={handleAddProductLine}
        onUpdateProductLineQuantity={handleUpdateProductLineQuantity}
        onAddPackLine={handleAddPackLine}
        onStartBundleDraft={handleStartBundleDraft}
        onAddBundleAsTemplate={(bundleId) => {
          void handleAddBundleAsTemplate(bundleId);
        }}
        onAddBundleCandy={handleAddBundleCandy}
        onBundleDraftComponentsChange={(components) =>
          setBundleDraft((current) =>
            current ? { ...current, components } : current,
          )
        }
        onBundleDraftQuantityChange={(quantity) =>
          setBundleDraft((current) =>
            current ? { ...current, quantity } : current,
          )
        }
        onConfirmBundleDraft={handleConfirmBundleDraft}
        onCancelBundleDraft={() => setBundleDraft(null)}
        onEditBundleLine={handleEditBundleLine}
        onRemoveLine={handleRemoveLine}
        getLineTotal={getLineTotal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
