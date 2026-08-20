"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPinned,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { StorefrontFunnelSteps } from "@/shared/components/storefront-funnel-steps/storefront-funnel-steps";
import { StockBannerSection } from "@/shared/components/stock-banner/stock-banner";
import { DeliveryMap } from "../delivery-map/delivery-map.dynamic";
import { CheckoutSelectField, CheckoutTextField } from "./checkout-form-field";
import type {
  CheckoutPageProps,
  GuestCheckoutFulfillmentMethod,
} from "./checkout-page.types";

function fulfillmentPillClass(selected: boolean): string {
  return [
    "font-label text-label-bold inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border-2 px-5 py-2.5 text-sm transition-colors",
    selected
      ? "border-primary bg-primary/5 text-primary"
      : "border-outline-variant/40 text-on-surface-variant hover:border-secondary/60",
  ].join(" ");
}

function CheckoutAtmosphere() {
  return (
    <>
      <div
        className="bg-secondary-fixed pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full opacity-35 blur-3xl"
        aria-hidden
      />
      <div
        className="bg-primary-fixed pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full opacity-30 blur-3xl"
        aria-hidden
      />
    </>
  );
}

function CheckoutFormSection({
  title,
  step,
  icon,
  children,
}: {
  title: string;
  step: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-outline-variant/30 soft-glow-pink bg-surface-container-lowest storefront-rise overflow-hidden rounded-3xl border shadow-sm">
      <div className="border-outline-variant/20 bg-surface-container-low/80 flex items-center gap-3 border-b px-4 py-3.5 md:px-6">
        <span className="bg-primary text-on-primary font-label text-label-bold flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs">
          {step}
        </span>
        <div className="text-primary shrink-0" aria-hidden>
          {icon}
        </div>
        <h2 className="font-label text-label-bold text-on-surface">{title}</h2>
      </div>
      <div className="space-y-4 p-4 md:p-6">{children}</div>
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

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="font-body text-body-sm text-on-surface-variant flex justify-between gap-3">
          <span>{labels.subtotal}</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="font-body text-body-sm text-on-surface-variant flex justify-between gap-3">
          <span>{labels.shipping}</span>
          <span>{shippingLabel}</span>
        </div>
        <div className="flex items-end justify-between gap-3 pt-1">
          <span className="font-body text-body-sm text-on-surface-variant">
            {labels.total}
          </span>
          <span className="font-display text-primary text-[28px] font-extrabold leading-none">
            {formatPrice(total)}
          </span>
        </div>
        {!covered && !isDeliveryPending ? (
          <p role="alert" className="font-body text-body-sm text-error">
            {labels.outOfCoverage}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="border-outline-variant/30 soft-glow-pink bg-surface-container-lowest overflow-hidden rounded-[28px] border shadow-sm">
      <div className="from-primary via-secondary to-tertiary bg-linear-to-r h-1.5" />
      <div className="space-y-4 p-6">
        <div>
          <p className="font-label text-label-bold text-on-surface">
            {labels.summaryTitle}
          </p>
          <p className="font-body text-body-sm text-on-surface-variant mt-1 flex items-start gap-2">
            <ShieldCheck
              className="text-secondary mt-0.5 h-4 w-4 shrink-0"
              aria-hidden
            />
            <span>{labels.secureNote}</span>
          </p>
        </div>

        <div className="border-outline-variant/20 space-y-3 border-t pt-4">
          <div className="font-body text-body-md text-on-surface-variant flex justify-between gap-3">
            <span>{labels.subtotal}</span>
            <span className="text-on-surface">{formatPrice(subtotal)}</span>
          </div>
          <div className="font-body text-body-md text-on-surface-variant flex justify-between gap-3">
            <span>{labels.shipping}</span>
            <span className="text-on-surface">{shippingLabel}</span>
          </div>
        </div>

        <div className="border-outline-variant/20 flex items-end justify-between gap-3 border-t pt-4">
          <span className="font-label text-label-bold text-on-surface">
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
            className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container focus-visible:ring-primary hidden min-h-12 w-full cursor-pointer items-center justify-center rounded-full px-6 py-3 transition-[transform,background-color,opacity] duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 lg:flex"
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
    </div>
  );
}

export function CheckoutPage({
  form,
  fieldErrors,
  showValidationSummary,
  fulfillmentMethod,
  showPickupPointOption,
  pickupPointId,
  pickupPointError,
  pickupPoints,
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
  onFulfillmentMethodChange,
  onPickupPointChange,
  onPickupPointBlur,
  onMapPinChange,
  onSubmit,
}: CheckoutPageProps) {
  const canSubmit =
    covered &&
    !isSubmitting &&
    !stockBlocked &&
    !isDeliveryPending &&
    !isStockPending;

  const selectedPickupPoint = pickupPoints.find(
    (point) => point.id === pickupPointId,
  );
  const pickupMapPin = selectedPickupPoint
    ? { lat: selectedPickupPoint.lat, lng: selectedPickupPoint.lng }
    : mapPin;

  const fulfillmentOptions: {
    method: GuestCheckoutFulfillmentMethod;
    label: string;
  }[] = [
    { method: "delivery", label: labels.fulfillmentDelivery },
    { method: "pickup_point", label: labels.fulfillmentPickupPoint },
  ];

  return (
    <StorefrontLayout>
      <section className="pt-stack-md md:pt-stack-lg md:pb-section-lg relative overflow-hidden pb-44">
        <CheckoutAtmosphere />

        <div className="container-max px-gutter relative z-10">
          <Link
            href="/carrito"
            className="font-label text-label-bold text-primary hover:bg-primary-fixed/50 focus-visible:ring-primary inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {labels.backToCart}
          </Link>

          <div className="gap-stack-md mt-stack-sm flex flex-col lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h1 className="font-display text-display-lg-mobile text-primary md:text-display-lg">
                {labels.title}
              </h1>
              <p className="font-body text-body-lg text-on-surface-variant mt-2 leading-relaxed">
                {labels.subtitle}
              </p>
            </div>
            <StorefrontFunnelSteps
              active="checkout"
              ariaLabel={labels.stepsLabel}
              labels={{
                cart: labels.stepCart,
                checkout: labels.stepCheckout,
                done: labels.stepDone,
              }}
            />
          </div>

          <form
            id="checkout-form"
            noValidate
            autoComplete="on"
            className="gap-stack-lg mt-stack-md grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <div className="space-y-stack-md">
              {showValidationSummary ? (
                <div
                  role="alert"
                  className="border-error/30 bg-error-container text-on-error-container storefront-rise rounded-2xl border px-4 py-3"
                >
                  <p className="font-body text-body-sm">
                    {labels.validationSummary}
                  </p>
                </div>
              ) : null}

              {errorMessage ? (
                <div
                  role="alert"
                  className="border-error/30 bg-error-container text-on-error-container storefront-rise rounded-2xl border px-4 py-3"
                >
                  <p className="font-body text-body-sm">{errorMessage}</p>
                </div>
              ) : null}

              <CheckoutFormSection
                title={labels.contactTitle}
                step="1"
                icon={<UserRound className="h-5 w-5" strokeWidth={2} />}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <CheckoutTextField
                    id="name"
                    label={labels.name}
                    value={form.name}
                    required
                    error={fieldErrors.name}
                    requiredHint={labels.requiredHint}
                    autoComplete="given-name"
                    autoCapitalize="words"
                    spellCheck={false}
                    maxLength={200}
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
                    autoCapitalize="words"
                    spellCheck={false}
                    maxLength={200}
                    onChange={(value) => onChange("lastName", value)}
                    onBlur={() => onFieldBlur("lastName", form)}
                  />
                  <CheckoutTextField
                    id="phone"
                    label={labels.phone}
                    value={form.phone}
                    required
                    error={fieldErrors.phone}
                    hint={fieldErrors.phone ? undefined : labels.phoneHint}
                    requiredHint={labels.requiredHint}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={9}
                    spellCheck={false}
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
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={320}
                    onChange={(value) => onChange("email", value)}
                    onBlur={() => onFieldBlur("email", form)}
                  />
                </div>
              </CheckoutFormSection>

              {showPickupPointOption ? (
                <CheckoutFormSection
                  title={labels.fulfillmentTitle}
                  step="2"
                  icon={<Truck className="h-5 w-5" strokeWidth={2} />}
                >
                  <div
                    role="tablist"
                    aria-label={labels.fulfillmentTitle}
                    className="flex flex-wrap gap-3"
                  >
                    {fulfillmentOptions.map(({ method, label }) => (
                      <label
                        key={method}
                        className={fulfillmentPillClass(
                          fulfillmentMethod === method,
                        )}
                      >
                        <input
                          type="radio"
                          name="fulfillmentMethod"
                          value={method}
                          checked={fulfillmentMethod === method}
                          className="sr-only"
                          onChange={() => onFulfillmentMethodChange(method)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </CheckoutFormSection>
              ) : null}

              {fulfillmentMethod === "delivery" ? (
                <>
                  <CheckoutFormSection
                    title={labels.addressTitle}
                    step={showPickupPointOption ? "3" : "2"}
                    icon={<Truck className="h-5 w-5" strokeWidth={2} />}
                  >
                    <CheckoutTextField
                      id="line1"
                      label={labels.line1}
                      value={form.line1}
                      required
                      error={fieldErrors.line1}
                      requiredHint={labels.requiredHint}
                      autoComplete="street-address"
                      maxLength={300}
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
                        autoCapitalize="words"
                        spellCheck={false}
                        maxLength={120}
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
                        autoCapitalize="words"
                        spellCheck={false}
                        maxLength={120}
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
                        maxLength={500}
                        onChange={(value) => onChange("reference", value)}
                        onBlur={() => onFieldBlur("reference", form)}
                      />
                    </div>
                  </CheckoutFormSection>

                  <CheckoutFormSection
                    title={labels.mapSectionTitle}
                    step={showPickupPointOption ? "4" : "3"}
                    icon={<MapPinned className="h-5 w-5" strokeWidth={2} />}
                  >
                    <DeliveryMap
                      mapPin={mapPin}
                      onChange={onMapPinChange}
                      labels={{
                        title: "",
                        hint: labels.mapHint,
                        search: {
                          searchLabel: labels.mapSearchLabel,
                          searchPlaceholder: labels.mapSearchPlaceholder,
                          searchNoResults: labels.mapSearchNoResults,
                        },
                      }}
                    />
                  </CheckoutFormSection>
                </>
              ) : (
                <CheckoutFormSection
                  title={labels.pickupPointTitle}
                  step="3"
                  icon={<MapPinned className="h-5 w-5" strokeWidth={2} />}
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="pickupPointId"
                      className="font-label text-label-bold text-on-surface block"
                    >
                      {labels.pickupPointTitle}
                      <span className="text-error ml-1" aria-hidden>
                        *
                      </span>
                    </label>
                    <select
                      id="pickupPointId"
                      name="pickupPointId"
                      value={pickupPointId}
                      required
                      aria-invalid={pickupPointError ? "true" : undefined}
                      aria-describedby={
                        pickupPointError ? "pickupPointId-error" : undefined
                      }
                      className={[
                        "font-body text-body-md border-outline-variant bg-surface-container-lowest text-on-surface focus-visible:ring-primary min-h-11 w-full rounded-2xl border px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2",
                        pickupPointError ? "border-error" : "",
                      ].join(" ")}
                      onChange={(event) =>
                        onPickupPointChange(event.target.value)
                      }
                      onBlur={onPickupPointBlur}
                    >
                      <option value="">{labels.pickupPointPlaceholder}</option>
                      {pickupPoints.map((point) => (
                        <option key={point.id} value={point.id}>
                          {point.name} · {formatPrice(point.fee)}
                        </option>
                      ))}
                    </select>
                    {pickupPointError ? (
                      <p
                        id="pickupPointId-error"
                        role="alert"
                        className="font-body text-body-sm text-error"
                      >
                        {pickupPointError}
                      </p>
                    ) : null}
                  </div>

                  {selectedPickupPoint ? (
                    <DeliveryMap
                      mapPin={pickupMapPin}
                      readOnly
                      labels={{
                        title: labels.mapTitle,
                        hint: labels.pickupMapHint,
                      }}
                    />
                  ) : null}
                </CheckoutFormSection>
              )}

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

      <footer className="border-outline-variant/20 bg-surface/95 z-9999 fixed inset-x-0 bottom-0 border-t backdrop-blur-md lg:hidden">
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
            className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary focus-visible:ring-primary mt-3 flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full px-6 py-3 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? labels.submitting : labels.submit}
          </button>
        </div>
      </footer>
    </StorefrontLayout>
  );
}
