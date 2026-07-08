"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, Candy, Search, X } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import { Button } from "@de-tin-marin/ui/button";
import {
  addBundleComponent,
  BUNDLE_CUSTOMIZATION_MAX,
  BUNDLE_CUSTOMIZATION_MIN,
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

export type OrderFormBundleCustomizeProps = {
  bundleName: string;
  containerName: string;
  containerNetPrice: number;
  templateQuantity: number;
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
  onQuantityChange: (quantity: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

function CustomizationProgress({
  current,
  label,
}: {
  current: number;
  label: string;
}) {
  const fillPercent = Math.min(100, (current / BUNDLE_CUSTOMIZATION_MAX) * 100);
  const minMarkerPercent =
    (BUNDLE_CUSTOMIZATION_MIN / BUNDLE_CUSTOMIZATION_MAX) * 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={BUNDLE_CUSTOMIZATION_MIN}
      aria-valuemax={BUNDLE_CUSTOMIZATION_MAX}
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
        unoptimized
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
  components,
  quantity,
  products,
  labelsByProductId,
  priceSummary,
  unitPricesByProductId,
  isPricePending,
  labels,
  onComponentsChange,
  onQuantityChange,
  onConfirm,
  onCancel,
}: OrderFormBundleCustomizeProps) {
  const [pickerExpanded, setPickerExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const validation = validateBundleCustomization(components);
  const canRemove = canRemoveBundleComponent(components);
  const canAdd = canAddBundleComponent(components);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const selectedIds = new Set(
      components.map((component) => component.productId),
    );
    const query = searchValue.trim().toLowerCase();
    return products
      .filter((product) => !selectedIds.has(product.id))
      .filter((product) =>
        query.length === 0
          ? true
          : product.name.toLowerCase().includes(query) ||
            product.sku.toLowerCase().includes(query),
      );
  }, [components, products, searchValue]);

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
            {components.length} / {BUNDLE_CUSTOMIZATION_MAX}
          </p>
        </div>
        <CustomizationProgress
          current={components.length}
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
                    removeBundleComponent(components, component.productId),
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
            ) : null}

            <label className="flex flex-col">
              <span className="sr-only">{labels.searchCandies}</span>
              <div className="relative">
                <Search
                  className="text-on-surface-variant pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={labels.searchCandiesPlaceholder}
                  disabled={!canAdd}
                  className="border-outline-variant/40 focus:border-secondary bg-surface w-full rounded-full border-2 py-2.5 pl-11 pr-4 text-sm outline-none transition-colors disabled:opacity-60"
                />
              </div>
            </label>

            {filteredProducts.length === 0 ? (
              <p className="text-on-surface-variant py-2 text-center text-sm">
                {labels.searchCandiesPlaceholder}
              </p>
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {filteredProducts.map((product) => (
                  <li
                    key={product.id}
                    className="border-outline-variant/30 bg-surface-container-low flex items-center gap-3 rounded-xl border px-3 py-2.5"
                  >
                    <ProductThumb
                      imageUrl={product.imageUrl}
                      name={product.name}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-label text-label-bold text-on-surface truncate text-sm">
                        {product.name}
                      </p>
                      <p className="text-on-surface-variant truncate text-xs">
                        {product.sku}
                      </p>
                      <p className="font-label text-label-bold text-primary text-sm">
                        {formatPrice(product.finalUnitPrice)}{" "}
                        <span className="text-on-surface-variant font-body text-body-sm font-normal">
                          {labels.unitPriceSuffix}
                        </span>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!canAdd}
                      className="shrink-0 px-4"
                      onClick={() =>
                        onComponentsChange(
                          addBundleComponent(components, product.id),
                        )
                      }
                    >
                      {labels.addCandyAction}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>

      <label className="flex flex-col">
        <span className={labelClass}>{labels.surpriseQuantity}</span>
        <input
          type="number"
          min={1}
          className={cn(fieldClass, "max-w-32")}
          value={quantity}
          onChange={(event) =>
            onQuantityChange(Math.max(1, Number(event.target.value) || 1))
          }
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
