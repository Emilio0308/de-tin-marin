"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getBundleAction } from "@/modules/catalog/actions/get-bundle";
import { listBundlesAction } from "@/modules/catalog/actions/list-bundles";
import { listProductsAction } from "@/modules/catalog/actions/list-products";
import {
  listDeliveryZonesAction,
  resolveDeliveryFeeAction,
} from "@/modules/delivery/actions/delivery.actions";
import { createOrderAction } from "@/modules/orders/actions/create-order";
import { previewAdminBundleLineAction } from "@/modules/orders/actions/preview-admin-bundle-line";
import { previewOrderCartAction } from "@/modules/orders/actions/preview-order-cart";
import { freshQueryOptions } from "@/shared/query/query-cache";
import { validateBundleCustomization } from "@de-tin-marin/validations/customize-bundle";
import { OrderForm } from "./order-form";
import { buildInitialBundleComponents } from "./order-form-bundle.helpers";
import {
  mergeOrAddProductLine,
  updateProductLineQuantity,
} from "./order-form-product.helpers";
import {
  estimateOrderFormLineTotal,
  previewOrderTotals,
  toCreateOrderPayload,
} from "./order-form.helpers";
import {
  emptyOrderFormValues,
  type OrderFormBundleDraft,
  type OrderFormLabels,
  type OrderFormValues,
} from "./order-form.types";

function orderErrorMessage(result: {
  error: string;
  message?: string;
}): string {
  switch (result.error) {
    case "VALIDATION":
      return "Revisa los campos del formulario";
    case "PRODUCT_NOT_FOUND":
      return "Uno o más productos no existen o están inactivos";
    case "BUNDLE_NOT_FOUND":
      return "La plantilla de sorpresa no existe o está inactiva";
    case "DUPLICATE_PRODUCT_IN_BUNDLE":
      return "No puedes repetir el mismo producto en una sorpresa";
    case "UNAUTHORIZED":
      return "Tu sesión expiró. Inicia sesión de nuevo.";
    case "FORBIDDEN":
      return "No tienes permisos de administrador.";
    default:
      return result.message
        ? `No se pudo crear la orden: ${result.message}`
        : "No se pudo crear la orden";
  }
}

export function OrderFormContainer() {
  const router = useRouter();
  const t = useTranslations("orders");
  const tDashboard = useTranslations("dashboard.orderStatus");
  const [values, setValues] = useState<OrderFormValues>(emptyOrderFormValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      subtotal: t("form.subtotal"),
      total: t("form.total"),
      createOrder: t("form.createOrder"),
      creating: t("form.creating"),
      productLine: t("form.productLine"),
      surpriseLine: t("form.surpriseLine"),
      formatComponents: (count) => t("form.formatComponents", { count }),
      formatQuantityLabel: (quantity) => t("form.quantityLabel", { quantity }),
      quantityBounds: (min, max) => t("form.quantityBounds", { min, max }),
      configureSurprise: t("form.configureSurprise"),
      customizeTitle: t("form.customizeTitle"),
      customizeSubtitle: t("form.customizeSubtitle"),
      candyCount: t("form.candyCount"),
      customizationProgress: t("form.customizationProgress"),
      minCandiesReached: t("form.minCandiesReached"),
      maxCandiesReached: t("form.maxCandiesReached"),
      removeCandy: t("form.removeCandy"),
      addCandy: t("form.addCandy"),
      selectCandy: t("form.selectCandy"),
      confirmSurprise: t("form.confirmSurprise"),
      cancelCustomize: t("form.cancelCustomize"),
      validationMinCandies: t("form.validationMinCandies"),
      validationMaxCandies: t("form.validationMaxCandies"),
      editSurprise: t("form.editSurprise"),
      candiesSubtotal: t("form.candiesSubtotal"),
      containerSubtotal: t("form.containerSubtotal"),
      containerCostHint: (unitPrice, quantity) =>
        t("form.containerCostHint", { unitPrice, quantity }),
      unitPriceSuffix: t("form.unitPriceSuffix"),
      customizeTotal: t("form.customizeTotal"),
      addCandyAction: t("form.addCandyAction"),
      candyAlreadyAdded: t("form.candyAlreadyAdded"),
      searchCandies: t("form.searchCandies"),
      searchCandiesPlaceholder: t("form.searchCandiesPlaceholder"),
      expandPicker: t("form.expandPicker"),
      collapsePicker: t("form.collapsePicker"),
      templatePersonCount: (count) => t("form.templatePersonCount", { count }),
      priceCalculating: t("form.priceCalculating"),
      surpriseQuantityHint: t("form.surpriseQuantityHint"),
    }),
    [t],
  );

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const result = await listProductsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const bundlesQuery = useQuery({
    queryKey: ["bundles"],
    queryFn: async () => {
      const result = await listBundlesAction();
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

  const productOptions = useMemo(
    () =>
      (productsQuery.data ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        finalPrice: product.finalPrice,
        finalUnitPrice: product.finalUnitPrice,
        imageUrl: product.imageUrl,
        productType: product.productType,
        itemsPerPackage: product.itemsPerPackage,
        stockTotalBaseUnits: product.stockTotalBaseUnits,
        purchaseMinQuantity: product.purchaseMinQuantity,
        purchaseMaxQuantity: product.purchaseMaxQuantity,
      })),
    [productsQuery.data],
  );

  const bundleOptions = useMemo(
    () =>
      (bundlesQuery.data ?? []).map((bundle) => ({
        id: bundle.id,
        name: bundle.name,
        containerId: bundle.containerId,
        containerName: bundle.containerName,
        containerNetPrice: bundle.containerNetPrice,
        templateQuantity: bundle.quantity,
      })),
    [bundlesQuery.data],
  );

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

  const activeProductIds = useMemo(
    () => new Set(productOptions.map((product) => product.id)),
    [productOptions],
  );

  useEffect(() => {
    void (async () => {
      const result = await resolveDeliveryFeeAction({
        method: values.fulfillment.method,
        district: values.fulfillment.deliveryAddress.district,
      });
      if (!result.ok) return;
      setValues((current) =>
        current.shippingTotal === result.fee
          ? current
          : { ...current, shippingTotal: result.fee },
      );
    })();
  }, [values.fulfillment.method, values.fulfillment.deliveryAddress.district]);

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
      validateBundleCustomization(debouncedBundlePreview.components).ok,
  });

  const cartPreviewPayload = useMemo(
    () => ({
      lines: values.lines.map((line) =>
        line.type === "product"
          ? line
          : {
              type: "bundle" as const,
              bundleId: line.bundleId,
              quantity: line.quantity,
              components: line.components,
            },
      ),
      shippingTotal: values.shippingTotal,
      discountTotal: values.discountTotal,
    }),
    [values.discountTotal, values.lines, values.shippingTotal],
  );

  const cartPreviewQuery = useQuery({
    ...freshQueryOptions,
    queryKey: [
      "admin-order",
      "cart-preview",
      cartPreviewPayload.lines,
      cartPreviewPayload.shippingTotal,
      cartPreviewPayload.discountTotal,
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
  );

  const totals = cartPreviewQuery.data ?? fallbackTotals;

  const bundlePriceSummary = bundlePreviewQuery.data
    ? {
        itemsSubtotal: bundlePreviewQuery.data.itemsSubtotal,
        containerSubtotal: bundlePreviewQuery.data.containerSubtotal,
        total: bundlePreviewQuery.data.lineTotal,
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
    return estimateOrderFormLineTotal(line, productOptions, bundlesById);
  }

  function handleAddProductLine(productId: string, quantity: number) {
    const product = productsById.get(productId);
    if (!product) return;

    setValues((current) => ({
      ...current,
      lines: mergeOrAddProductLine(current.lines, productId, quantity, product),
    }));
  }

  function handleUpdateProductLineQuantity(index: number, quantity: number) {
    const line = values.lines[index];
    if (!line || line.type !== "product") return;

    const product = productsById.get(line.productId);
    if (!product) return;

    setValues((current) => ({
      ...current,
      lines: updateProductLineQuantity(current.lines, index, quantity, product),
    }));
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
        setError("No se pudo cargar la plantilla de sorpresa");
        return;
      }

      const bundleOption = bundleOptions.find(
        (bundle) => bundle.id === bundleId,
      );
      const activeItems = result.data.items.filter((item) =>
        activeProductIds.has(item.productId),
      );

      setBundleDraft({
        bundleId,
        bundleName: result.data.name,
        containerName: bundleOption?.containerName ?? result.data.containerName,
        containerNetPrice:
          bundleOption?.containerNetPrice ?? result.data.containerNetPrice,
        templateQuantity: result.data.quantity,
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
          ),
        quantity: options?.quantity ?? result.data.quantity,
        editingLineIndex: options?.editingLineIndex ?? null,
      });
    } finally {
      setBundleDraftLoading(false);
    }
  }

  function handleStartBundleDraft(bundleId: string) {
    void loadBundleDraft(bundleId);
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

    const validation = validateBundleCustomization(bundleDraft.components);
    if (!validation.ok) {
      setError("La sorpresa no cumple las reglas de personalización");
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
    void (async () => {
      setSubmitting(true);
      setError(null);

      try {
        const result = await createOrderAction(toCreateOrderPayload(values));
        if (!result.ok) {
          setError(orderErrorMessage(result));
          return;
        }

        startTransition(() => {
          router.push(`/orders/${result.data.id}`);
        });
      } catch {
        setError("No se pudo crear la orden");
      } finally {
        setSubmitting(false);
      }
    })();
  }

  if (
    productsQuery.isLoading ||
    bundlesQuery.isLoading ||
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
        deliveryDistricts={(deliveryZonesQuery.data ?? [])
          .filter((zone) => zone.isActive)
          .map((zone) => zone.district)}
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
        labels={labels}
        onChange={setValues}
        onAddProductLine={handleAddProductLine}
        onUpdateProductLineQuantity={handleUpdateProductLineQuantity}
        onStartBundleDraft={handleStartBundleDraft}
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
