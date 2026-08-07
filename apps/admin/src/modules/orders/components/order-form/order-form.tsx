"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Gift,
  MapPin,
  Package,
  Receipt,
  ShoppingBag,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import { Button } from "@de-tin-marin/ui/button";
import { ProductSearchPickerContainer } from "@/modules/catalog/components/product-search-picker/product-search-picker.container";
import { GranularNumberInput } from "@/shared/forms/granular-number-input";
import { OrderFormBundleCustomize } from "./order-form-bundle-customize";
import { buildBundleComponentLabels } from "./order-form-bundle.helpers";
import { OrderFormCartLines } from "./order-form-cart-lines";
import {
  resolveOrderFormProductBounds,
  resolveProductAddBlockReason,
} from "./order-form-product.helpers";
import type { OrderFormProps } from "./order-form.types";

type CartTab = "products" | "packs" | "bundles";

const cardClass =
  "bg-surface-container-lowest border-outline-variant/40 flex flex-col rounded-xl border p-5 shadow-sm md:p-6";

const innerCardClass =
  "border-outline-variant/40 bg-surface-container-low/50 flex flex-col gap-4 rounded-xl border-2 p-4";

const labelClass =
  "font-label text-label-bold text-on-surface-variant mb-1.5 block text-xs uppercase tracking-wide";

const fieldClass =
  "border-outline-variant/40 focus:border-secondary bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors";

const disabledButtonClass =
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-surface-container-lowest disabled:hover:border-secondary/40";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="text-tertiary mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <h3 className="font-label text-label-bold text-sm uppercase tracking-wider">
        {title}
      </h3>
    </div>
  );
}

function methodPillClass(selected: boolean): string {
  return cn(
    "font-label text-label-bold cursor-pointer rounded-full border-2 px-5 py-2.5 text-sm transition-colors",
    selected
      ? "border-primary bg-primary/5 text-primary"
      : "border-outline-variant/40 text-on-surface-variant hover:border-secondary/60",
  );
}

function cartTabClass(selected: boolean): string {
  return cn(
    "font-label text-label-bold inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm transition-colors",
    selected
      ? "border-primary bg-primary/5 text-primary"
      : "border-outline-variant/40 text-on-surface-variant hover:border-secondary/60",
  );
}

export function OrderForm({
  values,
  products,
  bundles,
  packs,
  packCompositionsById,
  deliveryDistricts,
  bundleDraft,
  bundleDraftLoading,
  bundlePriceSummary,
  bundleUnitPricesByProductId,
  isBundlePricePending,
  totals,
  submitting,
  error,
  labels,
  onChange,
  onEnsureProductOption,
  onAddProductLine,
  onUpdateProductLineQuantity,
  onAddPackLine,
  onStartBundleDraft,
  onAddBundleAsTemplate,
  onAddBundleCandy,
  onBundleDraftComponentsChange,
  onBundleDraftQuantityChange,
  onConfirmBundleDraft,
  onCancelBundleDraft,
  onEditBundleLine,
  onRemoveLine,
  getLineTotal,
  onSubmit,
}: OrderFormProps) {
  const [draftProductId, setDraftProductId] = useState("");
  const [draftProductQty, setDraftProductQty] = useState(1);
  const [draftBundleId, setDraftBundleId] = useState("");
  const [draftPackId, setDraftPackId] = useState("");
  const [draftPackQty, setDraftPackQty] = useState(1);
  const [cartTab, setCartTab] = useState<CartTab>("products");

  const selectedProduct = products.find(
    (product) => product.id === draftProductId,
  );
  const selectedProductBounds = useMemo(
    () =>
      selectedProduct ? resolveOrderFormProductBounds(selectedProduct) : null,
    [selectedProduct],
  );
  const productAddBlock = resolveProductAddBlockReason(
    selectedProduct,
    selectedProductBounds,
  );
  const canAddProduct = productAddBlock === null;

  useEffect(() => {
    if (!selectedProductBounds) return;
    setDraftProductQty(selectedProductBounds.minQuantity);
  }, [selectedProductBounds]);

  useEffect(() => {
    if (!bundleDraft) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancelBundleDraft();
        setDraftBundleId("");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bundleDraft, onCancelBundleDraft]);

  const bundlesByName = useMemo(
    () => new Map(bundles.map((bundle) => [bundle.id, bundle.name])),
    [bundles],
  );

  const packsByName = useMemo(
    () => new Map(packs.map((pack) => [pack.id, pack.name])),
    [packs],
  );

  const selectedPack = packs.find((pack) => pack.id === draftPackId);

  useEffect(() => {
    if (!selectedPack) return;
    setDraftPackQty(selectedPack.purchaseMinQuantity);
  }, [selectedPack]);

  const bundleComponentLabels = useMemo(() => {
    if (!bundleDraft) return {};
    return buildBundleComponentLabels(
      bundleDraft.templateItems,
      Object.fromEntries(products.map((product) => [product.id, product.name])),
    );
  }, [bundleDraft, products]);

  return (
    <form
      className="flex flex-col gap-6 pb-28 md:pb-0"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div className={cardClass}>
          <SectionHeader icon={User} title={labels.contactSection} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={labels.name}>
              <input
                id="contact-name"
                className={fieldClass}
                value={values.contact.name}
                onChange={(event) =>
                  onChange({
                    ...values,
                    contact: { ...values.contact, name: event.target.value },
                  })
                }
              />
            </Field>
            <Field label={labels.lastName}>
              <input
                id="contact-last-name"
                className={fieldClass}
                value={values.contact.lastName}
                onChange={(event) =>
                  onChange({
                    ...values,
                    contact: {
                      ...values.contact,
                      lastName: event.target.value,
                    },
                  })
                }
              />
            </Field>
            <Field label={labels.phone}>
              <input
                id="contact-phone"
                className={fieldClass}
                value={values.contact.phone}
                onChange={(event) =>
                  onChange({
                    ...values,
                    contact: { ...values.contact, phone: event.target.value },
                  })
                }
              />
            </Field>
            <Field label={labels.email}>
              <input
                id="contact-email"
                type="email"
                className={fieldClass}
                value={values.contact.email}
                onChange={(event) =>
                  onChange({
                    ...values,
                    contact: { ...values.contact, email: event.target.value },
                  })
                }
              />
            </Field>
          </div>
        </div>

        <div className={cardClass}>
          <SectionHeader icon={MapPin} title={labels.deliverySection} />
          <div className="mb-4 flex flex-wrap gap-3">
            {(["delivery", "pickup"] as const).map((method) => (
              <label
                key={method}
                className={methodPillClass(
                  values.fulfillment.method === method,
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={values.fulfillment.method === method}
                  onChange={() =>
                    onChange({
                      ...values,
                      fulfillment: { ...values.fulfillment, method },
                    })
                  }
                />
                {method === "delivery" ? labels.delivery : labels.pickup}
              </label>
            ))}
          </div>
          {values.fulfillment.method === "delivery" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={labels.recipientName}>
                <input
                  className={fieldClass}
                  value={values.fulfillment.deliveryAddress.recipientName}
                  onChange={(event) =>
                    onChange({
                      ...values,
                      fulfillment: {
                        ...values.fulfillment,
                        deliveryAddress: {
                          ...values.fulfillment.deliveryAddress,
                          recipientName: event.target.value,
                        },
                      },
                    })
                  }
                />
              </Field>
              <Field label={labels.deliveryPhone}>
                <input
                  className={fieldClass}
                  value={values.fulfillment.deliveryAddress.phone}
                  onChange={(event) =>
                    onChange({
                      ...values,
                      fulfillment: {
                        ...values.fulfillment,
                        deliveryAddress: {
                          ...values.fulfillment.deliveryAddress,
                          phone: event.target.value,
                        },
                      },
                    })
                  }
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label={labels.address}>
                  <input
                    className={fieldClass}
                    value={values.fulfillment.deliveryAddress.line1}
                    onChange={(event) =>
                      onChange({
                        ...values,
                        fulfillment: {
                          ...values.fulfillment,
                          deliveryAddress: {
                            ...values.fulfillment.deliveryAddress,
                            line1: event.target.value,
                          },
                        },
                      })
                    }
                  />
                </Field>
              </div>
              <Field label={labels.district}>
                <select
                  className={fieldClass}
                  value={values.fulfillment.deliveryAddress.district}
                  onChange={(event) =>
                    onChange({
                      ...values,
                      fulfillment: {
                        ...values.fulfillment,
                        deliveryAddress: {
                          ...values.fulfillment.deliveryAddress,
                          district: event.target.value,
                        },
                      },
                    })
                  }
                >
                  <option value="">{labels.selectDistrict}</option>
                  {deliveryDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={labels.city}>
                <input
                  className={fieldClass}
                  value={values.fulfillment.deliveryAddress.city}
                  onChange={(event) =>
                    onChange({
                      ...values,
                      fulfillment: {
                        ...values.fulfillment,
                        deliveryAddress: {
                          ...values.fulfillment.deliveryAddress,
                          city: event.target.value,
                        },
                      },
                    })
                  }
                />
              </Field>
              <Field label={labels.province}>
                <input
                  className={fieldClass}
                  value={values.fulfillment.deliveryAddress.province}
                  onChange={(event) =>
                    onChange({
                      ...values,
                      fulfillment: {
                        ...values.fulfillment,
                        deliveryAddress: {
                          ...values.fulfillment.deliveryAddress,
                          province: event.target.value,
                        },
                      },
                    })
                  }
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label={labels.reference}>
                  <input
                    className={fieldClass}
                    value={values.fulfillment.deliveryAddress.reference}
                    onChange={(event) =>
                      onChange({
                        ...values,
                        fulfillment: {
                          ...values.fulfillment,
                          deliveryAddress: {
                            ...values.fulfillment.deliveryAddress,
                            reference: event.target.value,
                          },
                        },
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          ) : (
            <p className="text-on-surface-variant text-sm">{labels.pickup}</p>
          )}
        </div>
      </section>

      <section className={cn(cardClass, "gap-4")}>
        <SectionHeader icon={ShoppingBag} title={labels.cartSection} />

        <div
          role="tablist"
          aria-label={labels.cartSection}
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={cartTab === "products"}
            className={cartTabClass(cartTab === "products")}
            onClick={() => setCartTab("products")}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {labels.tabProducts}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={cartTab === "packs"}
            className={cartTabClass(cartTab === "packs")}
            onClick={() => setCartTab("packs")}
          >
            <Package className="h-4 w-4" aria-hidden />
            {labels.tabCombos}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={cartTab === "bundles"}
            className={cartTabClass(cartTab === "bundles")}
            onClick={() => setCartTab("bundles")}
          >
            <Gift className="h-4 w-4" aria-hidden />
            {labels.tabSurprises}
          </button>
        </div>

        {cartTab === "products" ? (
          <div role="tabpanel" className={cn(innerCardClass, "gap-4")}>
            <Field label={labels.product}>
              <ProductSearchPickerContainer
                status="active"
                excludeIds={[]}
                onSelect={(item) => {
                  onEnsureProductOption({
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
                  });
                  setDraftProductId(item.id);
                }}
                labels={{
                  searchPlaceholder: labels.selectProduct,
                  searchAriaLabel: labels.selectProduct,
                }}
              />
              {draftProductId && selectedProduct ? (
                <p className="text-on-surface-variant mt-1.5 text-xs">
                  {selectedProduct.name} · S/{" "}
                  {selectedProduct.finalPrice.toFixed(2)}
                </p>
              ) : null}
            </Field>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label={labels.quantity}>
                <GranularNumberInput
                  mode="integer"
                  min={selectedProductBounds?.minQuantity ?? 1}
                  max={selectedProductBounds?.maxQuantity}
                  emptyFallback={selectedProductBounds?.minQuantity ?? 1}
                  disabled={
                    !selectedProduct || !selectedProductBounds?.purchasable
                  }
                  className={cn(fieldClass, "sm:w-32")}
                  value={draftProductQty}
                  onValueChange={(next) =>
                    setDraftProductQty(
                      next ?? selectedProductBounds?.minQuantity ?? 1,
                    )
                  }
                />
                {selectedProductBounds ? (
                  <p className="text-on-surface-variant mt-1.5 text-xs">
                    {labels.quantityBounds(
                      selectedProductBounds.minQuantity,
                      selectedProductBounds.maxQuantity,
                    )}
                  </p>
                ) : null}
              </Field>
              <div className="flex flex-1 flex-col gap-1.5 sm:items-end">
                <Button
                  type="button"
                  variant="secondary"
                  className={cn(
                    "min-h-11 w-full sm:w-auto",
                    disabledButtonClass,
                  )}
                  disabled={!canAddProduct}
                  onClick={() => {
                    if (!draftProductId || !canAddProduct) return;
                    onAddProductLine(draftProductId, draftProductQty);
                    setDraftProductId("");
                    setDraftProductQty(1);
                  }}
                >
                  {labels.addProduct}
                </Button>
                {productAddBlock ? (
                  <p className="text-error text-xs sm:text-right" role="status">
                    {productAddBlock.code === "NO_SELECTION"
                      ? labels.selectProductFirst
                      : labels.productOutOfStock(
                          productAddBlock.minQuantity,
                          productAddBlock.available,
                        )}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {cartTab === "packs" ? (
          <div
            role="tabpanel"
            className={cn(
              innerCardClass,
              "sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-end",
            )}
          >
            <Field label={labels.combo}>
              <select
                className={fieldClass}
                value={draftPackId}
                onChange={(event) => setDraftPackId(event.target.value)}
              >
                <option value="">{labels.selectCombo}</option>
                {packs.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} — S/ {pack.finalPrice.toFixed(2)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={labels.quantity}>
              <GranularNumberInput
                mode="integer"
                min={selectedPack?.purchaseMinQuantity ?? 1}
                max={selectedPack?.purchaseMaxQuantity ?? 100}
                emptyFallback={selectedPack?.purchaseMinQuantity ?? 1}
                className={fieldClass}
                value={draftPackQty}
                onValueChange={(next) =>
                  setDraftPackQty(
                    next ?? selectedPack?.purchaseMinQuantity ?? 1,
                  )
                }
              />
            </Field>
            <Button
              type="button"
              variant="secondary"
              className={cn("min-h-11 w-full sm:w-auto", disabledButtonClass)}
              disabled={!draftPackId}
              onClick={() => {
                if (!draftPackId) return;
                onAddPackLine(draftPackId, draftPackQty);
                setDraftPackId("");
                setDraftPackQty(1);
              }}
            >
              {labels.addCombo}
            </Button>
          </div>
        ) : null}

        {cartTab === "bundles" ? (
          <div role="tabpanel" className={innerCardClass}>
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
              <Field label={labels.surprise}>
                <select
                  className={fieldClass}
                  value={draftBundleId}
                  onChange={(event) => setDraftBundleId(event.target.value)}
                >
                  <option value="">{labels.selectSurprise}</option>
                  {bundles.map((bundle) => (
                    <option key={bundle.id} value={bundle.id}>
                      {bundle.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className={cn(
                    "min-h-11 w-full sm:w-auto",
                    disabledButtonClass,
                  )}
                  disabled={!draftBundleId || bundleDraftLoading}
                  onClick={() => {
                    if (!draftBundleId) return;
                    onAddBundleAsTemplate(draftBundleId);
                    setDraftBundleId("");
                  }}
                >
                  {bundleDraftLoading
                    ? labels.addingSurprise
                    : labels.addSurprise}
                </Button>
                <Button
                  type="button"
                  className={cn(
                    "min-h-11 w-full sm:w-auto",
                    disabledButtonClass,
                  )}
                  disabled={!draftBundleId || bundleDraftLoading}
                  onClick={() => {
                    if (!draftBundleId) return;
                    onStartBundleDraft(draftBundleId);
                  }}
                >
                  {labels.configureSurprise}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {bundleDraft ? (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-bundle-customize-title"
          >
            <button
              type="button"
              className="bg-inverse-surface/50 absolute inset-0 cursor-default"
              aria-label={labels.cancelCustomize}
              onClick={() => {
                onCancelBundleDraft();
                setDraftBundleId("");
              }}
            />
            <div className="border-outline-variant/30 bg-surface-container-lowest relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border shadow-2xl sm:rounded-3xl">
              <div className="p-4 sm:p-6">
                <p id="order-bundle-customize-title" className="sr-only">
                  {labels.customizeTitle}
                </p>
                <OrderFormBundleCustomize
                  bundleName={bundleDraft.bundleName}
                  containerName={bundleDraft.containerName}
                  containerNetPrice={bundleDraft.containerNetPrice}
                  templateQuantity={bundleDraft.templateQuantity}
                  components={bundleDraft.components}
                  quantity={bundleDraft.quantity}
                  products={products}
                  labelsByProductId={bundleComponentLabels}
                  priceSummary={bundlePriceSummary}
                  unitPricesByProductId={bundleUnitPricesByProductId}
                  isPricePending={isBundlePricePending}
                  labels={{
                    title: labels.customizeTitle,
                    subtitle: labels.customizeSubtitle,
                    candyCount: labels.candyCount,
                    progressLabel: labels.customizationProgress,
                    minReached: labels.minCandiesReached,
                    maxReached: labels.maxCandiesReached,
                    removeCandy: labels.removeCandy,
                    addCandy: labels.addCandy,
                    surpriseQuantity: labels.surpriseQuantity,
                    surpriseQuantityHint: labels.surpriseQuantityHint,
                    templatePersonCount: labels.templatePersonCount,
                    priceCalculating: labels.priceCalculating,
                    confirm: labels.confirmSurprise,
                    cancel: labels.cancelCustomize,
                    validationMin: labels.validationMinCandies,
                    validationMax: labels.validationMaxCandies,
                    candiesSubtotal: labels.candiesSubtotal,
                    containerSubtotal: labels.containerSubtotal,
                    containerCostHint: labels.containerCostHint,
                    unitPriceSuffix: labels.unitPriceSuffix,
                    customizeTotal: labels.customizeTotal,
                    addCandyAction: labels.addCandyAction,
                    candyAlreadyAdded: labels.candyAlreadyAdded,
                    searchCandies: labels.searchCandies,
                    searchCandiesPlaceholder: labels.searchCandiesPlaceholder,
                    expandPicker: labels.expandPicker,
                    collapsePicker: labels.collapsePicker,
                  }}
                  onComponentsChange={onBundleDraftComponentsChange}
                  onAddCandy={onAddBundleCandy}
                  onQuantityChange={onBundleDraftQuantityChange}
                  onConfirm={() => {
                    onConfirmBundleDraft();
                    setDraftBundleId("");
                  }}
                  onCancel={() => {
                    onCancelBundleDraft();
                    setDraftBundleId("");
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        <OrderFormCartLines
          lines={values.lines}
          products={products}
          bundlesByName={bundlesByName}
          packsByName={packsByName}
          packCompositionsById={packCompositionsById}
          labels={{
            surpriseLine: labels.surpriseLine,
            comboLine: labels.comboLine,
            formatQuantityLabel: labels.formatQuantityLabel,
            formatComponents: labels.formatComponents,
            viewComponents: labels.viewComponents,
            removeLine: labels.removeLine,
            editSurprise: labels.editSurprise,
            emptyLines: labels.emptyLines,
          }}
          onRemoveLine={onRemoveLine}
          onUpdateProductQuantity={onUpdateProductLineQuantity}
          onEditBundleLine={(index) => {
            setCartTab("bundles");
            onEditBundleLine(index);
          }}
          getLineTotal={getLineTotal}
        />
      </section>

      <section className={cn(cardClass, "gap-4")}>
        <SectionHeader icon={Receipt} title={labels.totalsSection} />
        <div className="grid max-w-lg gap-4">
          <Field label={labels.shipping}>
            <input
              type="number"
              min={0}
              step="0.01"
              readOnly
              className={cn(fieldClass, "bg-surface-container-low/80")}
              value={values.shippingTotal}
            />
            <p className="font-body text-body-sm text-on-surface-variant mt-1.5">
              {labels.shippingHint}
            </p>
          </Field>
          <Field label={labels.discount}>
            <GranularNumberInput
              mode="decimal"
              min={0}
              emptyFallback={0}
              className={fieldClass}
              value={values.discountTotal}
              onValueChange={(next) =>
                onChange({
                  ...values,
                  discountTotal: next ?? 0,
                })
              }
            />
          </Field>
          {totals ? (
            <div className="border-outline-variant/40 rounded-xl border-2 p-4">
              <div className="font-body text-body-md text-on-surface-variant flex justify-between">
                <span>{labels.subtotal}</span>
                <span>S/ {totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="border-outline-variant/40 mt-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-label text-label-bold text-on-surface">
                    {labels.total}
                  </span>
                  <span className="font-display text-primary text-2xl font-extrabold">
                    S/ {totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {error ? (
        <p className="text-error font-body text-body-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="border-outline-variant/40 bg-surface-container-lowest fixed inset-x-0 bottom-0 z-10 border-t p-4 md:static md:border-0 md:bg-transparent md:p-0">
        <Button
          type="submit"
          disabled={submitting || values.lines.length === 0}
          className="shadow-primary/20 min-h-12 w-full px-8 shadow-lg md:w-auto"
        >
          {submitting ? labels.creating : labels.createOrder}
        </Button>
      </div>
    </form>
  );
}
