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
import { deriveAdjustmentsFromFinalPrice } from "@de-tin-marin/shared/order-cart";
import { Button } from "@de-tin-marin/ui/button";
import { ProductSearchPickerContainer } from "@/modules/catalog/components/product-search-picker/product-search-picker.container";
import { GranularNumberInput } from "@/shared/forms/granular-number-input";
import { OrderFormBundleCustomize } from "./order-form-bundle-customize";
import { buildBundleComponentLabels } from "./order-form-bundle.helpers";
import { OrderFormCartLines } from "./order-form-cart-lines";
import {
  resolveOrderFormPackBounds,
  resolveOrderFormProductBounds,
  resolvePackAddBlockReason,
  resolveProductAddBlockReason,
} from "./order-form-product.helpers";
import type { OrderFormProps } from "./order-form.types";

type CartTab = "products" | "packs" | "bundles";
type TotalsTab = "final" | "adjustments";

const cardClass =
  "bg-surface-container-lowest border-outline-variant/40 flex flex-col rounded-xl border p-5 shadow-sm md:p-6";

const innerCardClass =
  "border-outline-variant/40 bg-surface-container-low/50 flex flex-col gap-4 rounded-xl border-2 p-4";

const labelClass =
  "font-label text-label-bold text-on-surface-variant mb-1.5 block text-xs uppercase tracking-wide";

const fieldClass =
  "border-outline-variant/40 focus:border-secondary bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors";

const fieldErrorClass =
  "border-error focus:border-error bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors";

const disabledButtonClass =
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-surface-container-lowest disabled:hover:border-secondary/40";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col">
      <span className={labelClass}>{label}</span>
      {children}
      {error ? (
        <p className="text-error mt-1.5 text-xs" role="alert">
          {error}
        </p>
      ) : null}
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
  pickupPoints,
  bundleDraft,
  bundleDraftLoading,
  bundlePriceSummary,
  bundleUnitPricesByProductId,
  isBundlePricePending,
  totals,
  submitting,
  error,
  fieldErrors,
  labels,
  onChange,
  onFieldBlur,
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
  const [draftPackageQty, setDraftPackageQty] = useState(1);
  const [draftUnitQty, setDraftUnitQty] = useState(0);
  const [draftBundleId, setDraftBundleId] = useState("");
  const [draftPackId, setDraftPackId] = useState("");
  const [draftPackQty, setDraftPackQty] = useState(1);
  const [cartTab, setCartTab] = useState<CartTab>("products");
  const [totalsTab, setTotalsTab] = useState<TotalsTab>("final");

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
  const isPackageProduct =
    selectedProduct?.productType === "package" &&
    (selectedProduct.itemsPerPackage ?? 1) > 1;
  const packageIpp = Math.max(1, selectedProduct?.itemsPerPackage ?? 1);
  const availableBase = Math.max(0, selectedProduct?.stockTotalBaseUnits ?? 0);
  const maxDraftPackages = isPackageProduct
    ? Math.floor(availableBase / packageIpp)
    : (selectedProductBounds?.maxQuantity ?? 1);
  const maxDraftUnits = isPackageProduct
    ? Math.max(0, availableBase - draftPackageQty * packageIpp)
    : 0;
  const canAddProduct =
    productAddBlock === null && draftPackageQty + draftUnitQty >= 1;

  useEffect(() => {
    if (!selectedProduct) return;
    if (
      selectedProduct.productType === "package" &&
      selectedProduct.itemsPerPackage > 1
    ) {
      const ipp = Math.max(1, selectedProduct.itemsPerPackage);
      const available = Math.max(0, selectedProduct.stockTotalBaseUnits);
      const maxPkg = Math.floor(available / ipp);
      setDraftPackageQty(maxPkg >= 1 ? 1 : 0);
      setDraftUnitQty(maxPkg >= 1 ? 0 : available >= 1 ? 1 : 0);
      return;
    }
    if (!selectedProductBounds) return;
    setDraftPackageQty(selectedProductBounds.minQuantity);
    setDraftUnitQty(0);
  }, [selectedProduct, selectedProductBounds]);

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
  const selectedPackBounds = useMemo(
    () => (selectedPack ? resolveOrderFormPackBounds(selectedPack) : null),
    [selectedPack],
  );
  const packAddBlock = resolvePackAddBlockReason(
    selectedPack,
    selectedPackBounds,
  );
  const canAddPack = packAddBlock === null;

  useEffect(() => {
    if (!selectedPackBounds) return;
    setDraftPackQty(selectedPackBounds.minQuantity);
  }, [selectedPackBounds]);

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
            <Field label={labels.name} error={fieldErrors["contact.name"]}>
              <input
                id="contact-name"
                className={
                  fieldErrors["contact.name"] ? fieldErrorClass : fieldClass
                }
                aria-invalid={Boolean(fieldErrors["contact.name"])}
                value={values.contact.name}
                autoComplete="given-name"
                autoCapitalize="words"
                spellCheck={false}
                maxLength={200}
                onChange={(event) =>
                  onChange({
                    ...values,
                    contact: { ...values.contact, name: event.target.value },
                  })
                }
                onBlur={() => onFieldBlur("contact.name")}
              />
            </Field>
            <Field
              label={labels.lastName}
              error={fieldErrors["contact.lastName"]}
            >
              <input
                id="contact-last-name"
                className={
                  fieldErrors["contact.lastName"] ? fieldErrorClass : fieldClass
                }
                aria-invalid={Boolean(fieldErrors["contact.lastName"])}
                value={values.contact.lastName}
                autoComplete="family-name"
                autoCapitalize="words"
                spellCheck={false}
                maxLength={200}
                onChange={(event) =>
                  onChange({
                    ...values,
                    contact: {
                      ...values.contact,
                      lastName: event.target.value,
                    },
                  })
                }
                onBlur={() => onFieldBlur("contact.lastName")}
              />
            </Field>
            <Field label={labels.phone} error={fieldErrors["contact.phone"]}>
              <input
                id="contact-phone"
                className={
                  fieldErrors["contact.phone"] ? fieldErrorClass : fieldClass
                }
                aria-invalid={Boolean(fieldErrors["contact.phone"])}
                value={values.contact.phone}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                spellCheck={false}
                maxLength={9}
                onChange={(event) =>
                  onChange({
                    ...values,
                    contact: { ...values.contact, phone: event.target.value },
                  })
                }
                onBlur={() => onFieldBlur("contact.phone")}
              />
            </Field>
            <Field label={labels.email} error={fieldErrors["contact.email"]}>
              <input
                id="contact-email"
                type="email"
                className={
                  fieldErrors["contact.email"] ? fieldErrorClass : fieldClass
                }
                aria-invalid={Boolean(fieldErrors["contact.email"])}
                value={values.contact.email}
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={320}
                onChange={(event) =>
                  onChange({
                    ...values,
                    contact: { ...values.contact, email: event.target.value },
                  })
                }
                onBlur={() => onFieldBlur("contact.email")}
              />
            </Field>
          </div>
        </div>

        <div className={cardClass}>
          <SectionHeader icon={MapPin} title={labels.deliverySection} />
          <div className="mb-4 flex flex-wrap gap-3">
            {(["delivery", "pickup", "pickup_point"] as const).map((method) => (
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
                {method === "delivery"
                  ? labels.delivery
                  : method === "pickup"
                    ? labels.pickup
                    : labels.pickupPoint}
              </label>
            ))}
          </div>
          {values.fulfillment.method === "delivery" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={labels.recipientName}
                error={
                  fieldErrors["fulfillment.deliveryAddress.recipientName"] ??
                  fieldErrors["fulfillment.deliveryAddress"]
                }
              >
                <input
                  className={
                    fieldErrors["fulfillment.deliveryAddress.recipientName"] ||
                    fieldErrors["fulfillment.deliveryAddress"]
                      ? fieldErrorClass
                      : fieldClass
                  }
                  aria-invalid={Boolean(
                    fieldErrors["fulfillment.deliveryAddress.recipientName"] ||
                    fieldErrors["fulfillment.deliveryAddress"],
                  )}
                  value={values.fulfillment.deliveryAddress.recipientName}
                  autoComplete="name"
                  autoCapitalize="words"
                  spellCheck={false}
                  maxLength={200}
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
                  onBlur={() =>
                    onFieldBlur("fulfillment.deliveryAddress.recipientName")
                  }
                />
              </Field>
              <Field
                label={labels.deliveryPhone}
                error={fieldErrors["fulfillment.deliveryAddress.phone"]}
              >
                <input
                  className={
                    fieldErrors["fulfillment.deliveryAddress.phone"]
                      ? fieldErrorClass
                      : fieldClass
                  }
                  aria-invalid={Boolean(
                    fieldErrors["fulfillment.deliveryAddress.phone"],
                  )}
                  value={values.fulfillment.deliveryAddress.phone}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  spellCheck={false}
                  maxLength={9}
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
                  onBlur={() =>
                    onFieldBlur("fulfillment.deliveryAddress.phone")
                  }
                />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label={labels.address}
                  error={fieldErrors["fulfillment.deliveryAddress.line1"]}
                >
                  <input
                    className={
                      fieldErrors["fulfillment.deliveryAddress.line1"]
                        ? fieldErrorClass
                        : fieldClass
                    }
                    aria-invalid={Boolean(
                      fieldErrors["fulfillment.deliveryAddress.line1"],
                    )}
                    value={values.fulfillment.deliveryAddress.line1}
                    autoComplete="street-address"
                    maxLength={300}
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
                    onBlur={() =>
                      onFieldBlur("fulfillment.deliveryAddress.line1")
                    }
                  />
                </Field>
              </div>
              <Field
                label={labels.district}
                error={fieldErrors["fulfillment.deliveryAddress.district"]}
              >
                <select
                  className={
                    fieldErrors["fulfillment.deliveryAddress.district"]
                      ? fieldErrorClass
                      : fieldClass
                  }
                  aria-invalid={Boolean(
                    fieldErrors["fulfillment.deliveryAddress.district"],
                  )}
                  value={values.fulfillment.deliveryAddress.district}
                  autoComplete="address-level3"
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
                  onBlur={() =>
                    onFieldBlur("fulfillment.deliveryAddress.district")
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
              <Field
                label={labels.city}
                error={fieldErrors["fulfillment.deliveryAddress.city"]}
              >
                <input
                  className={
                    fieldErrors["fulfillment.deliveryAddress.city"]
                      ? fieldErrorClass
                      : fieldClass
                  }
                  aria-invalid={Boolean(
                    fieldErrors["fulfillment.deliveryAddress.city"],
                  )}
                  value={values.fulfillment.deliveryAddress.city}
                  autoComplete="address-level2"
                  autoCapitalize="words"
                  spellCheck={false}
                  maxLength={120}
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
                  onBlur={() => onFieldBlur("fulfillment.deliveryAddress.city")}
                />
              </Field>
              <Field
                label={labels.province}
                error={fieldErrors["fulfillment.deliveryAddress.province"]}
              >
                <input
                  className={
                    fieldErrors["fulfillment.deliveryAddress.province"]
                      ? fieldErrorClass
                      : fieldClass
                  }
                  aria-invalid={Boolean(
                    fieldErrors["fulfillment.deliveryAddress.province"],
                  )}
                  value={values.fulfillment.deliveryAddress.province}
                  autoComplete="address-level1"
                  autoCapitalize="words"
                  spellCheck={false}
                  maxLength={120}
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
                  onBlur={() =>
                    onFieldBlur("fulfillment.deliveryAddress.province")
                  }
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label={labels.reference}>
                  <input
                    className={fieldClass}
                    value={values.fulfillment.deliveryAddress.reference}
                    maxLength={500}
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
                    onBlur={() =>
                      onFieldBlur("fulfillment.deliveryAddress.reference")
                    }
                  />
                </Field>
              </div>
            </div>
          ) : values.fulfillment.method === "pickup_point" ? (
            <Field
              label={labels.pickupPoint}
              error={fieldErrors["fulfillment.pickupPoint"]}
            >
              <select
                value={values.fulfillment.pickupPointId}
                className={cn(
                  "border-outline-variant bg-surface-container-lowest text-on-surface focus-visible:ring-primary min-h-11 w-full rounded-xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2",
                  fieldErrors["fulfillment.pickupPoint"] && "border-error",
                )}
                onChange={(event) =>
                  onChange({
                    ...values,
                    fulfillment: {
                      ...values.fulfillment,
                      pickupPointId: event.target.value,
                    },
                  })
                }
              >
                <option value="">{labels.selectPickupPoint}</option>
                {pickupPoints
                  .filter((point) => point.isActive)
                  .map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name}
                    </option>
                  ))}
              </select>
            </Field>
          ) : (
            <p className="text-on-surface-variant text-sm">{labels.pickup}</p>
          )}
        </div>
      </section>

      <section className={cn(cardClass, "gap-4")}>
        <SectionHeader icon={ShoppingBag} title={labels.cartSection} />
        {fieldErrors.lines ? (
          <p className="text-error text-xs" role="alert">
            {fieldErrors.lines}
          </p>
        ) : null}

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
              {isPackageProduct ? (
                <>
                  <Field label={labels.packagesLabel}>
                    <GranularNumberInput
                      mode="integer"
                      min={0}
                      max={maxDraftPackages}
                      emptyFallback={0}
                      disabled={!selectedProduct || productAddBlock !== null}
                      className={cn(fieldClass, "sm:w-28")}
                      value={draftPackageQty}
                      onValueChange={(next) => setDraftPackageQty(next ?? 0)}
                    />
                  </Field>
                  <Field label={labels.unitsLabel}>
                    <GranularNumberInput
                      mode="integer"
                      min={0}
                      max={maxDraftUnits}
                      emptyFallback={0}
                      disabled={!selectedProduct || productAddBlock !== null}
                      className={cn(fieldClass, "sm:w-28")}
                      value={draftUnitQty}
                      onValueChange={(next) => setDraftUnitQty(next ?? 0)}
                    />
                  </Field>
                </>
              ) : (
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
                    value={draftPackageQty}
                    onValueChange={(next) =>
                      setDraftPackageQty(
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
              )}
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
                    onAddProductLine(
                      draftProductId,
                      draftPackageQty,
                      draftUnitQty,
                    );
                    setDraftProductId("");
                    setDraftPackageQty(1);
                    setDraftUnitQty(0);
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
          <div role="tabpanel" className={innerCardClass}>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
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
                  min={selectedPackBounds?.minQuantity ?? 1}
                  max={selectedPackBounds?.maxQuantity}
                  emptyFallback={selectedPackBounds?.minQuantity ?? 1}
                  disabled={!selectedPack || !selectedPackBounds?.purchasable}
                  className={cn(fieldClass, "sm:w-32")}
                  value={draftPackQty}
                  onValueChange={(next) =>
                    setDraftPackQty(
                      next ?? selectedPackBounds?.minQuantity ?? 1,
                    )
                  }
                />
              </Field>
              <Button
                type="button"
                variant="secondary"
                className={cn("min-h-11 w-full sm:w-auto", disabledButtonClass)}
                disabled={!canAddPack}
                onClick={() => {
                  if (!draftPackId || !canAddPack) return;
                  onAddPackLine(draftPackId, draftPackQty);
                  setDraftPackId("");
                  setDraftPackQty(1);
                }}
              >
                {labels.addCombo}
              </Button>
            </div>
            {selectedPackBounds ? (
              <p className="text-on-surface-variant text-xs">
                {labels.quantityBounds(
                  selectedPackBounds.minQuantity,
                  selectedPackBounds.maxQuantity,
                )}
              </p>
            ) : null}
            {packAddBlock ? (
              <div className="text-error text-xs" role="status">
                {packAddBlock.code === "NO_SELECTION" ? (
                  <p>{labels.selectComboFirst}</p>
                ) : (
                  <>
                    <p>{labels.packOutOfStock(packAddBlock.available)}</p>
                    {packAddBlock.stockShortages.length > 0 ? (
                      <p className="mt-1">
                        {labels.packStockShortages(
                          packAddBlock.stockShortages
                            .map((item) => `${item.productName} (${item.sku})`)
                            .join(", "),
                        )}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
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
                  customizationMinProducts={
                    bundleDraft.customizationMinProducts
                  }
                  customizationMaxProducts={
                    bundleDraft.customizationMaxProducts
                  }
                  components={bundleDraft.components}
                  quantity={bundleDraft.quantity}
                  products={products}
                  labelsByProductId={bundleComponentLabels}
                  priceSummary={bundlePriceSummary}
                  unitPricesByProductId={bundleUnitPricesByProductId}
                  isPricePending={isBundlePricePending}
                  labels={{
                    title: labels.customizeTitle,
                    subtitle: labels.customizeSubtitle(
                      bundleDraft.customizationMinProducts,
                      bundleDraft.customizationMaxProducts,
                    ),
                    candyCount: labels.candyCount,
                    progressLabel: labels.customizationProgress,
                    minReached: labels.minCandiesReached(
                      bundleDraft.customizationMinProducts,
                    ),
                    maxReached: labels.maxCandiesReached(
                      bundleDraft.customizationMaxProducts,
                    ),
                    removeCandy: labels.removeCandy,
                    addCandy: labels.addCandy,
                    surpriseQuantity: labels.surpriseQuantity,
                    surpriseQuantityHint: labels.surpriseQuantityHint,
                    templatePersonCount: labels.templatePersonCount,
                    priceCalculating: labels.priceCalculating,
                    confirm: labels.confirmSurprise,
                    cancel: labels.cancelCustomize,
                    validationMin: labels.validationMinCandies(
                      bundleDraft.customizationMinProducts,
                    ),
                    validationMax: labels.validationMaxCandies(
                      bundleDraft.customizationMaxProducts,
                    ),
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
            formatProductDualQty: labels.formatProductDualQty,
            packagesLabel: labels.packagesLabel,
            unitsLabel: labels.unitsLabel,
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

          <div
            role="tablist"
            aria-label={labels.totalsSection}
            className="flex flex-wrap gap-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={totalsTab === "final"}
              className={cartTabClass(totalsTab === "final")}
              onClick={() => setTotalsTab("final")}
            >
              {labels.tabFinalPrice}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={totalsTab === "adjustments"}
              className={cartTabClass(totalsTab === "adjustments")}
              onClick={() => setTotalsTab("adjustments")}
            >
              {labels.tabAdjustments}
            </button>
          </div>

          {totalsTab === "final" ? (
            <div role="tabpanel" className={innerCardClass}>
              <Field label={labels.finalPrice}>
                <GranularNumberInput
                  mode="decimal"
                  min={0}
                  emptyFallback={0}
                  className={fieldClass}
                  value={totals?.total ?? values.shippingTotal}
                  onValueChange={(next) => {
                    const subtotal = totals?.subtotal ?? 0;
                    const adjustments = deriveAdjustmentsFromFinalPrice({
                      subtotal,
                      shippingTotal: values.shippingTotal,
                      finalTotal: next ?? 0,
                    });
                    onChange({
                      ...values,
                      discountTotal: adjustments.discountTotal,
                      surchargeTotal: adjustments.surchargeTotal,
                    });
                  }}
                />
                <p className="font-body text-body-sm text-on-surface-variant mt-1.5">
                  {labels.finalPriceHint}
                </p>
              </Field>
            </div>
          ) : (
            <div role="tabpanel" className={cn(innerCardClass, "gap-4")}>
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
              <Field label={labels.surcharge}>
                <GranularNumberInput
                  mode="decimal"
                  min={0}
                  emptyFallback={0}
                  className={fieldClass}
                  value={values.surchargeTotal}
                  onValueChange={(next) =>
                    onChange({
                      ...values,
                      surchargeTotal: next ?? 0,
                    })
                  }
                />
              </Field>
            </div>
          )}

          {totals ? (
            <div className="border-outline-variant/40 rounded-xl border-2 p-4">
              <div className="font-body text-body-md text-on-surface-variant flex justify-between">
                <span>{labels.subtotal}</span>
                <span>S/ {totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discountTotal > 0 ? (
                <div className="font-body text-body-md text-on-surface-variant mt-2 flex justify-between">
                  <span>{labels.discount}</span>
                  <span>− S/ {totals.discountTotal.toFixed(2)}</span>
                </div>
              ) : null}
              {totals.surchargeTotal > 0 ? (
                <div className="font-body text-body-md text-on-surface-variant mt-2 flex justify-between">
                  <span>{labels.surcharge}</span>
                  <span>+ S/ {totals.surchargeTotal.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="font-body text-body-md text-on-surface-variant mt-2 flex justify-between">
                <span>{labels.shipping}</span>
                <span>S/ {totals.shippingTotal.toFixed(2)}</span>
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
