"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, Candy, X } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import { Button } from "@de-tin-marin/ui/button";
import { ProductSearchPickerContainer } from "@/modules/catalog/components/product-search-picker/product-search-picker.container";
import type { ProductSearchPickerItem } from "@/modules/catalog/components/product-search-picker/product-search-picker.types";
import { GranularNumberInput } from "@/shared/forms/granular-number-input";
import {
  canAddBundleComponent,
  canRemoveBundleComponent,
  removeBundleComponent,
} from "./order-form-bundle.helpers";
import { validateBundleCustomization } from "@de-tin-marin/validations/customize-bundle";
import type {
  OrderFormBundleComponent,
  OrderFormBundlePriceSummary,
  ProductOption,
} from "./order-form.types";

const innerCardClass =
  "border-outline-variant/40 bg-surface-container-low/50 flex flex-col gap-4 rounded-xl border-2 p-4";

const labelClass =
  "font-label text-label-bold text-on-surface-variant mb-1.5 block text-xs uppercase tracking-wide";

const fieldClass =
  "border-outline-variant/40 focus:border-secondary bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors";

function formatPrice(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

function toProductOption(item: ProductSearchPickerItem): ProductOption {
  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    finalPrice: item.finalPrice,
    finalUnitPrice: item.finalUnitPrice,
    imageUrl: item.imageUrl,
    productType: item.productType,
    itemsPerPackage: item.itemsPerPackage,
    stockTotalBaseUnits: item.stockTotalBaseUnits,
    purchaseMinQuantity: item.purchaseMinQuantity,
    purchaseMaxQuantity: item.purchaseMaxQuantity,
  };
}

export type OrderFormBundleCustomizeProps = {
  bundleName: string;
  containerName: string;
  containerNetPrice: number;
  templateQuantity: number;
  customizationMinProducts: number;
  customizationMaxProducts: number;
  components: OrderFormBundleComponent[];
  quantity: number;
  products: ProductOption[];
  labelsByProductId: Record<string, string>;
  priceSummary: OrderFormBundlePriceSummary | null;
  unitPricesByProductId: Record<string, number>;
  isPricePending: boolean;
  labels: {
    title: string;
    subtitle: string;
    candyCount: string;
    progressLabel: string;
    minReached: string;
    maxReached: string;
    removeCandy: string;
    addCandy: string;
    surpriseQuantity: string;
    surpriseQuantityHint: string;
    templatePersonCount: (count: number) => string;
    priceCalculating: string;
    confirm: string;
    cancel: string;
    validationMin: string;
    validationMax: string;
    candiesSubtotal: string;
    containerSubtotal: string;
    containerCostHint: (unitPrice: string, quantity: number) => string;
    unitPriceSuffix: string;
    customizeTotal: string;
    addCandyAction: string;
    candyAlreadyAdded: string;
    searchCandies: string;
    searchCandiesPlaceholder: string;
    expandPicker: string;
    collapsePicker: string;
  };
  onComponentsChange: (components: OrderFormBundleComponent[]) => void;
  onAddCandy: (product: ProductOption) => void;
  onQuantityChange: (quantity: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

function CustomizationProgress({
  current,
  minProducts,
  maxProducts,
  label,
}: {
  current: number;
  minProducts: number;
  maxProducts: number;
  label: string;
}) {
  const fillPercent = Math.min(100, (current / maxProducts) * 100);
  const minMarkerPercent = (minProducts / maxProducts) * 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={minProducts}
      aria-valuemax={maxProducts}
      aria-label={label}
      className="bg-surface-container relative h-2.5 overflow-hidden rounded-full"
    >
      <div
        className="bg-primary h-full rounded-full transition-all duration-300"
        style={{ width: `${fillPercent}%` }}
      />
      <div
        className="bg-outline absolute bottom-0 top-0 w-0.5"
        style={{ left: `${minMarkerPercent}%` }}
        aria-hidden
      />
    </div>
  );
}

function ProductThumb({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  if (!imageUrl?.trim()) {
    return (
      <div
        className="bg-surface-container text-on-surface-variant/50 border-outline-variant/30 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-sm"
        aria-hidden
      >
        <Candy className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border-outline-variant/30 relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border shadow-sm">
      <Image
        src={imageUrl}
        alt={name}
        fill
        sizes="56px"
        className="object-cover"
      />
    </div>
  );
}

export function OrderFormBundleCustomize({
  bundleName,
  containerName,
  containerNetPrice,
  templateQuantity,
  customizationMinProducts,
  customizationMaxProducts,
  components,
  quantity,
  products,
  labelsByProductId,
  priceSummary,
  unitPricesByProductId,
  isPricePending,
  labels,
  onComponentsChange,
  onAddCandy,
  onQuantityChange,
  onConfirm,
  onCancel,
}: OrderFormBundleCustomizeProps) {
  const [pickerExpanded, setPickerExpanded] = useState(false);
  const bounds = {
    minProducts: customizationMinProducts,
    maxProducts: customizationMaxProducts,
  };

  const validation = validateBundleCustomization(components, bounds);
  const canRemove = canRemoveBundleComponent(components, bounds);
  const canAdd = canAddBundleComponent(components, bounds);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const excludeIds = useMemo(
    () => components.map((component) => component.productId),
    [components],
  );

  const canConfirm = validation.ok && !isPricePending && priceSummary !== null;

  return (
    <div className={innerCardClass}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-label text-label-bold text-on-surface">
            {labels.title}
          </p>
          <p className="text-on-surface-variant mt-1 text-sm">
            {labels.subtitle}
          </p>
          <p className="font-label text-label-bold text-on-surface mt-2 text-sm">
            {bundleName}
          </p>
          <p className="text-on-surface-variant text-xs">
            {labels.templatePersonCount(templateQuantity)} · {containerName} ·{" "}
            {formatPrice(containerNetPrice)}
          </p>
        </div>
        <button
          type="button"
          className="text-on-surface-variant hover:text-on-surface shrink-0"
          onClick={onCancel}
          aria-label={labels.cancel}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <p className="font-label text-label-bold text-on-surface text-sm">
            {labels.candyCount}
          </p>
          <p className="text-on-surface-variant text-sm" aria-live="polite">
            {components.length} / {customizationMaxProducts}
          </p>
        </div>
        <CustomizationProgress
          current={components.length}
          minProducts={customizationMinProducts}
          maxProducts={customizationMaxProducts}
          label={labels.progressLabel}
        />
      </div>

      {!validation.ok ? (
        <p className="text-error text-sm" role="alert">
          {validation.error === "MIN_COMPONENTS"
            ? labels.validationMin
            : labels.validationMax}
        </p>
      ) : null}

      {!canRemove ? (
        <p className="text-on-surface-variant bg-surface-container border-outline-variant/30 rounded-xl border px-4 py-3 text-sm">
          {labels.minReached}
        </p>
      ) : null}

      <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {components.map((component) => {
          const product = productsById.get(component.productId);
          const name =
            product?.name ?? labelsByProductId[component.productId] ?? "—";
          const unitPrice =
            unitPricesByProductId[component.productId] ??
            product?.finalUnitPrice ??
            0;

          return (
            <li
              key={component.productId}
              className="border-outline-variant/50 bg-surface flex items-center gap-3 rounded-lg border px-3 py-2.5"
            >
              <ProductThumb imageUrl={product?.imageUrl ?? null} name={name} />
              <div className="min-w-0 flex-1">
                <p className="font-label text-label-bold text-on-surface truncate text-sm">
                  {name}
                </p>
                <p className="text-on-surface-variant text-xs">
                  {formatPrice(unitPrice)} {labels.unitPriceSuffix}
                </p>
              </div>
              <button
                type="button"
                disabled={!canRemove}
                className="text-primary font-label text-label-bold shrink-0 text-sm hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() =>
                  onComponentsChange(
                    removeBundleComponent(
                      components,
                      component.productId,
                      bounds,
                    ),
                  )
                }
              >
                {labels.removeCandy}
              </button>
            </li>
          );
        })}
      </ul>

      <section className="border-outline-variant/30 bg-surface-container-lowest rounded-xl border p-4">
        <button
          type="button"
          onClick={() => setPickerExpanded((current) => !current)}
          aria-expanded={pickerExpanded}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <span className="font-label text-label-bold text-on-surface text-sm">
            {labels.addCandy}
          </span>
          <span className="text-on-surface-variant inline-flex items-center gap-1 text-sm">
            <span className="hidden sm:inline">
              {pickerExpanded ? labels.collapsePicker : labels.expandPicker}
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                pickerExpanded && "rotate-180",
              )}
              aria-hidden
            />
          </span>
        </button>

        {pickerExpanded ? (
          <div className="mt-4 space-y-4">
            {!canAdd ? (
              <p className="text-on-surface-variant text-sm">
                {labels.maxReached}
              </p>
            ) : (
              <ProductSearchPickerContainer
                status="active"
                excludeIds={excludeIds}
                onSelect={(item) => onAddCandy(toProductOption(item))}
                labels={{
                  searchPlaceholder: labels.searchCandiesPlaceholder,
                  searchAriaLabel: labels.searchCandies,
                }}
              />
            )}
          </div>
        ) : null}
      </section>

      <label className="flex flex-col">
        <span className={labelClass}>{labels.surpriseQuantity}</span>
        <GranularNumberInput
          mode="integer"
          min={1}
          emptyFallback={1}
          className={cn(fieldClass, "max-w-32")}
          value={quantity}
          onValueChange={(next) => onQuantityChange(next ?? 1)}
        />
        <p className="text-on-surface-variant mt-1.5 text-xs">
          {labels.surpriseQuantityHint}
        </p>
      </label>

      <section className="border-primary/20 bg-primary/5 space-y-3 rounded-xl border p-4">
        {isPricePending ? (
          <p className="text-on-surface-variant text-sm">
            {labels.priceCalculating}
          </p>
        ) : priceSummary ? (
          <>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-on-surface-variant">
                {labels.candiesSubtotal}
              </span>
              <span className="font-label text-label-bold text-on-surface">
                {formatPrice(priceSummary.itemsSubtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-on-surface-variant">
                {labels.containerSubtotal}
              </span>
              <span className="font-label text-label-bold text-on-surface">
                {formatPrice(priceSummary.containerSubtotal)}
              </span>
            </div>
            <p className="text-on-surface-variant/80 text-xs">
              {labels.containerCostHint(
                formatPrice(containerNetPrice),
                quantity,
              )}
            </p>
            <div className="bg-primary/20 h-px w-full" />
            <div className="flex items-center justify-between gap-4">
              <span className="font-label text-label-bold text-primary text-sm uppercase">
                {labels.customizeTotal}
              </span>
              <span className="font-display text-primary text-xl font-extrabold">
                {formatPrice(priceSummary.total)}
              </span>
            </div>
          </>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={!canConfirm} onClick={onConfirm}>
          {labels.confirm}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {labels.cancel}
        </Button>
      </div>
    </div>
  );
}
