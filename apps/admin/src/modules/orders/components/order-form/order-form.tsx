"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  MapPin,
  Receipt,
  ShoppingBag,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import { Button } from "@de-tin-marin/ui/button";
import { OrderFormBundleCustomize } from "./order-form-bundle-customize";
import { buildBundleComponentLabels } from "./order-form-bundle.helpers";
import { OrderFormCartLines } from "./order-form-cart-lines";
import { resolveOrderFormProductBounds } from "./order-form-product.helpers";
import type { OrderFormProps } from "./order-form.types";

const cardClass =
  "bg-surface-container-lowest border-outline-variant/40 flex flex-col rounded-xl border p-5 shadow-sm md:p-6";

const innerCardClass =
  "border-outline-variant/40 bg-surface-container-low/50 flex flex-col gap-4 rounded-xl border-2 p-4";

const labelClass =
  "font-label text-label-bold text-on-surface-variant mb-1.5 block text-xs uppercase tracking-wide";

const fieldClass =
  "border-outline-variant/40 focus:border-secondary bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors";

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

export function OrderForm({
  values,
  products,
  bundles,
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
  onAddProductLine,
  onUpdateProductLineQuantity,
  onStartBundleDraft,
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

  const selectedProduct = products.find(
    (product) => product.id === draftProductId,
  );
  const selectedProductBounds = useMemo(
    () =>
      selectedProduct ? resolveOrderFormProductBounds(selectedProduct) : null,
    [selectedProduct],
  );

  useEffect(() => {
    if (!selectedProductBounds) return;
    setDraftProductQty(selectedProductBounds.minQuantity);
  }, [selectedProductBounds]);

  const bundlesByName = useMemo(
    () => new Map(bundles.map((bundle) => [bundle.id, bundle.name])),
    [bundles],
  );

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
          className={cn(
            innerCardClass,
            "md:grid md:grid-cols-[1fr_auto_auto] md:items-end",
          )}
        >
          <Field label={labels.product}>
            <select
              className={fieldClass}
              value={draftProductId}
              onChange={(event) => setDraftProductId(event.target.value)}
            >
              <option value="">{labels.selectProduct}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (S/ {product.finalPrice.toFixed(2)})
                </option>
              ))}
            </select>
          </Field>
          <Field label={labels.quantity}>
            <input
              type="number"
              min={selectedProductBounds?.minQuantity ?? 1}
              max={selectedProductBounds?.maxQuantity}
              disabled={!selectedProduct || !selectedProductBounds?.purchasable}
              className={cn(fieldClass, "md:w-28")}
              value={draftProductQty}
              onChange={(event) =>
                setDraftProductQty(Number(event.target.value) || 1)
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
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full md:w-auto"
            disabled={!draftProductId || !selectedProductBounds?.purchasable}
            onClick={() => {
              if (!draftProductId) return;
              onAddProductLine(draftProductId, draftProductQty);
              setDraftProductId("");
              setDraftProductQty(1);
            }}
          >
            {labels.addProduct}
          </Button>
        </div>

        <div className={innerCardClass}>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
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
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full sm:w-auto"
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

        {bundleDraft ? (
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
        ) : null}

        <OrderFormCartLines
          lines={values.lines}
          products={products}
          bundlesByName={bundlesByName}
          labels={{
            surpriseLine: labels.surpriseLine,
            formatQuantityLabel: labels.formatQuantityLabel,
            formatComponents: labels.formatComponents,
            removeLine: labels.removeLine,
            editSurprise: labels.editSurprise,
            emptyLines: labels.emptyLines,
          }}
          onRemoveLine={onRemoveLine}
          onUpdateProductQuantity={onUpdateProductLineQuantity}
          onEditBundleLine={onEditBundleLine}
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
            <input
              type="number"
              min={0}
              step="0.01"
              className={fieldClass}
              value={values.discountTotal}
              onChange={(event) =>
                onChange({
                  ...values,
                  discountTotal: Number(event.target.value) || 0,
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
