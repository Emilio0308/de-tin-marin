"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { StockBannerSection } from "@/shared/components/stock-banner/stock-banner";
import { DeliveryMap } from "../delivery-map/delivery-map.dynamic";
import { CheckoutSelectField, CheckoutTextField } from "./checkout-form-field";
import type { CheckoutPageProps } from "./checkout-page.types";

function CheckoutFormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-outline-variant/30 bg-surface-container-lowest space-y-4 rounded-2xl border p-4 shadow-sm md:p-6">
      <h2 className="font-label text-label-bold text-on-surface">{title}</h2>
      {children}
    </section>
  );
}

function CheckoutSummaryPanel({
  subtotal,
  shippingTotal,
  total,
  covered,
  isDeliveryPending,
  isSubmitting,
  canSubmit,
  labels,
  showSubmitButton = true,
  compact = false,
}: {
  subtotal: number;
  shippingTotal: number;
  total: number;
  covered: boolean;
  isDeliveryPending: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  labels: CheckoutPageProps["labels"];
  showSubmitButton?: boolean;
  compact?: boolean;
}) {
  const shippingLabel = isDeliveryPending
    ? labels.shippingPending
    : formatPrice(shippingTotal);

  return (
    <div
      className={
        compact
          ? "space-y-3"
          : "border-outline-variant/30 bg-surface-container-lowest soft-glow-pink space-y-4 rounded-3xl border p-6 shadow-sm"
      }
    >
      <div className="font-body text-body-md text-on-surface-variant flex justify-between">
        <span>{labels.subtotal}</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="font-body text-body-md text-on-surface-variant flex justify-between">
        <span>{labels.shipping}</span>
        <span>{shippingLabel}</span>
      </div>
      <div
        className={
          compact
            ? "flex items-end justify-between gap-3"
            : "border-outline-variant/20 border-t pt-4"
        }
      >
        <span
          className={
            compact
              ? "font-body text-body-sm text-on-surface-variant"
              : "font-label text-label-bold text-on-surface"
          }
        >
          {labels.total}
        </span>
        <span className="font-display text-price-display text-primary">
          {formatPrice(total)}
        </span>
      </div>
      {showSubmitButton ? (
        <button
          type="submit"
          disabled={!canSubmit}
          className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container flex min-h-12 w-full items-center justify-center rounded-full px-6 py-3 transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? labels.submitting : labels.submit}
        </button>
      ) : null}
      {!covered && !isDeliveryPending ? (
        <p role="alert" className="font-body text-body-sm text-error">
          {labels.outOfCoverage}
        </p>
      ) : null}
    </div>
  );
}

export function CheckoutPage({
  form,
  fieldErrors,
  showValidationSummary,
  districts,
  mapPin,
  subtotal,
  shippingTotal,
  total,
  covered,
  isDeliveryPending,
  isSubmitting,
  errorMessage,
  stockBlocked,
  isStockPending,
  stockWarning,
  stockMessages,
  labels,
  onChange,
  onFieldBlur,
  onMapPinChange,
  onSubmit,
}: CheckoutPageProps) {
  const canSubmit =
    covered &&
    !isSubmitting &&
    !stockBlocked &&
    !isDeliveryPending &&
    !isStockPending;

  return (
    <StorefrontLayout>
      <section className="bg-tertiary/5 pt-stack-md md:pt-stack-lg md:pb-section-lg pb-44">
        <div className="container-max px-gutter">
          <Link
            href="/carrito"
            className="font-label text-label-bold text-primary hover:text-secondary inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {labels.backToCart}
          </Link>

          <h1 className="font-display text-display-lg-mobile text-primary md:text-display-lg mt-stack-sm">
            {labels.title}
          </h1>

          <form
            id="checkout-form"
            noValidate
            autoComplete="on"
            className="gap-stack-lg mt-stack-md grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <div className="space-y-stack-md">
              {showValidationSummary ? (
                <div
                  role="alert"
                  className="border-error/30 bg-error-container text-on-error-container rounded-2xl border px-4 py-3"
                >
                  <p className="font-body text-body-sm">
                    {labels.validationSummary}
                  </p>
                </div>
              ) : null}

              {errorMessage ? (
                <div
                  role="alert"
                  className="border-error/30 bg-error-container text-on-error-container rounded-2xl border px-4 py-3"
                >
                  <p className="font-body text-body-sm">{errorMessage}</p>
                </div>
              ) : null}

              <CheckoutFormSection title={labels.contactTitle}>
                <div className="grid gap-4 md:grid-cols-2">
                  <CheckoutTextField
                    id="name"
                    label={labels.name}
                    value={form.name}
                    required
                    error={fieldErrors.name}
                    requiredHint={labels.requiredHint}
                    autoComplete="given-name"
                    onChange={(value) => onChange("name", value)}
                    onBlur={() => onFieldBlur("name", form)}
                  />
                  <CheckoutTextField
                    id="lastName"
                    label={labels.lastName}
                    value={form.lastName}
                    required
                    error={fieldErrors.lastName}
                    requiredHint={labels.requiredHint}
                    autoComplete="family-name"
                    onChange={(value) => onChange("lastName", value)}
                    onBlur={() => onFieldBlur("lastName", form)}
                  />
                  <CheckoutTextField
                    id="phone"
                    label={labels.phone}
                    value={form.phone}
                    required
                    error={fieldErrors.phone}
                    requiredHint={labels.requiredHint}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    onChange={(value) => onChange("phone", value)}
                    onBlur={() => onFieldBlur("phone", form)}
                  />
                  <CheckoutTextField
                    id="email"
                    label={labels.email}
                    value={form.email}
                    required
                    error={fieldErrors.email}
                    requiredHint={labels.requiredHint}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    onChange={(value) => onChange("email", value)}
                    onBlur={() => onFieldBlur("email", form)}
                  />
                </div>
              </CheckoutFormSection>

              <CheckoutFormSection title={labels.addressTitle}>
                <CheckoutTextField
                  id="line1"
                  label={labels.line1}
                  value={form.line1}
                  required
                  error={fieldErrors.line1}
                  requiredHint={labels.requiredHint}
                  autoComplete="street-address"
                  onChange={(value) => onChange("line1", value)}
                  onBlur={() => onFieldBlur("line1", form)}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <CheckoutSelectField
                    id="district"
                    label={labels.district}
                    value={form.district}
                    required
                    error={fieldErrors.district}
                    requiredHint={labels.requiredHint}
                    placeholder={labels.districtPlaceholder}
                    options={districts.map((zone) => ({
                      value: zone.district,
                      label: zone.district,
                    }))}
                    onChange={(value) => onChange("district", value)}
                    onBlur={() => onFieldBlur("district", form)}
                  />
                  <CheckoutTextField
                    id="city"
                    label={labels.city}
                    value={form.city}
                    required
                    error={fieldErrors.city}
                    requiredHint={labels.requiredHint}
                    autoComplete="address-level2"
                    onChange={(value) => onChange("city", value)}
                    onBlur={() => onFieldBlur("city", form)}
                  />
                  <CheckoutTextField
                    id="province"
                    label={labels.province}
                    value={form.province}
                    required
                    error={fieldErrors.province}
                    requiredHint={labels.requiredHint}
                    autoComplete="address-level1"
                    onChange={(value) => onChange("province", value)}
                    onBlur={() => onFieldBlur("province", form)}
                  />
                  <CheckoutTextField
                    id="reference"
                    label={labels.reference}
                    value={form.reference}
                    hint={labels.referenceHint}
                    requiredHint={labels.requiredHint}
                    autoComplete="off"
                    onChange={(value) => onChange("reference", value)}
                    onBlur={() => onFieldBlur("reference", form)}
                  />
                </div>
              </CheckoutFormSection>

              <section className="border-outline-variant/30 bg-surface-container-lowest space-y-4 rounded-2xl border p-4 shadow-sm md:p-6">
                <DeliveryMap
                  mapPin={mapPin}
                  onChange={onMapPinChange}
                  labels={{ title: labels.mapTitle, hint: labels.mapHint }}
                />
              </section>

              <div className="space-y-4 lg:hidden">
                <StockBannerSection
                  isStockPending={isStockPending}
                  stockWarning={stockWarning}
                  title={labels.stockTitle}
                  checkingLabel={labels.stockChecking}
                  messages={stockMessages}
                />
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-4">
                <StockBannerSection
                  isStockPending={isStockPending}
                  stockWarning={stockWarning}
                  title={labels.stockTitle}
                  checkingLabel={labels.stockChecking}
                  messages={stockMessages}
                />
                <CheckoutSummaryPanel
                  subtotal={subtotal}
                  shippingTotal={shippingTotal}
                  total={total}
                  covered={covered}
                  isDeliveryPending={isDeliveryPending}
                  isSubmitting={isSubmitting}
                  canSubmit={canSubmit}
                  labels={labels}
                />
              </div>
            </aside>
          </form>
        </div>
      </section>

      <footer className="border-outline-variant/20 bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md lg:hidden">
        <div className="container-max px-gutter mx-auto py-3">
          <CheckoutSummaryPanel
            subtotal={subtotal}
            shippingTotal={shippingTotal}
            total={total}
            covered={covered}
            isDeliveryPending={isDeliveryPending}
            isSubmitting={isSubmitting}
            canSubmit={canSubmit}
            labels={labels}
            compact
          />
          <button
            type="submit"
            form="checkout-form"
            disabled={!canSubmit}
            className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary mt-3 flex min-h-12 w-full items-center justify-center rounded-full px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? labels.submitting : labels.submit}
          </button>
        </div>
      </footer>
    </StorefrontLayout>
  );
}
