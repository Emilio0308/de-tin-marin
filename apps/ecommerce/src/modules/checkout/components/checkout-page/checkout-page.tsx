"use client";

import Link from "next/link";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import type { MapPin } from "@de-tin-marin/validations/checkout";
import { DeliveryMap } from "../delivery-map/delivery-map.dynamic";

export type CheckoutPageProps = {
  form: {
    name: string;
    lastName: string;
    phone: string;
    email: string;
    line1: string;
    district: string;
    city: string;
    province: string;
    reference: string;
  };
  districts: Array<{ id: string; district: string; fee: number }>;
  mapPin: MapPin;
  subtotal: number;
  shippingTotal: number;
  total: number;
  covered: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  stockBlocked: boolean;
  stockMessages: string[];
  labels: {
    title: string;
    backToCart: string;
    contactTitle: string;
    addressTitle: string;
    name: string;
    lastName: string;
    phone: string;
    email: string;
    line1: string;
    district: string;
    city: string;
    province: string;
    reference: string;
    mapTitle: string;
    mapHint: string;
    subtotal: string;
    shipping: string;
    total: string;
    submit: string;
    submitting: string;
    outOfCoverage: string;
    stockTitle: string;
    emptyCart: string;
  };
  onChange: (field: keyof CheckoutPageProps["form"], value: string) => void;
  onMapPinChange: (pin: MapPin) => void;
  onSubmit: () => void;
};

export function CheckoutPage({
  form,
  districts,
  mapPin,
  subtotal,
  shippingTotal,
  total,
  covered,
  isSubmitting,
  errorMessage,
  stockBlocked,
  stockMessages,
  labels,
  onChange,
  onMapPinChange,
  onSubmit,
}: CheckoutPageProps) {
  const canSubmit = covered && !isSubmitting && !stockBlocked;

  return (
    <StorefrontLayout>
      <section className="container-max px-gutter py-section-lg">
        <Link
          href="/carrito"
          className="font-label text-label-bold text-primary hover:text-secondary mb-8 inline-block"
        >
          {labels.backToCart}
        </Link>

        <h1 className="font-display text-display-md-mobile text-on-surface md:text-display-md mb-8">
          {labels.title}
        </h1>

        <form
          className="gap-stack-lg grid lg:grid-cols-[1fr_320px]"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="font-label text-label-bold text-on-surface">
                {labels.contactTitle}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  required
                  value={form.name}
                  onChange={(event) => onChange("name", event.target.value)}
                  placeholder={labels.name}
                  className="border-outline-variant rounded-xl border px-4 py-3"
                />
                <input
                  required
                  value={form.lastName}
                  onChange={(event) => onChange("lastName", event.target.value)}
                  placeholder={labels.lastName}
                  className="border-outline-variant rounded-xl border px-4 py-3"
                />
                <input
                  required
                  value={form.phone}
                  onChange={(event) => onChange("phone", event.target.value)}
                  placeholder={labels.phone}
                  className="border-outline-variant rounded-xl border px-4 py-3"
                />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => onChange("email", event.target.value)}
                  placeholder={labels.email}
                  className="border-outline-variant rounded-xl border px-4 py-3"
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-label text-label-bold text-on-surface">
                {labels.addressTitle}
              </h2>
              <input
                required
                value={form.line1}
                onChange={(event) => onChange("line1", event.target.value)}
                placeholder={labels.line1}
                className="border-outline-variant w-full rounded-xl border px-4 py-3"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <select
                  required
                  value={form.district}
                  onChange={(event) => onChange("district", event.target.value)}
                  className="border-outline-variant rounded-xl border px-4 py-3"
                >
                  <option value="">{labels.district}</option>
                  {districts.map((zone) => (
                    <option key={zone.id} value={zone.district}>
                      {zone.district}
                    </option>
                  ))}
                </select>
                <input
                  required
                  value={form.city}
                  onChange={(event) => onChange("city", event.target.value)}
                  placeholder={labels.city}
                  className="border-outline-variant rounded-xl border px-4 py-3"
                />
                <input
                  required
                  value={form.province}
                  onChange={(event) => onChange("province", event.target.value)}
                  placeholder={labels.province}
                  className="border-outline-variant rounded-xl border px-4 py-3"
                />
                <input
                  value={form.reference}
                  onChange={(event) =>
                    onChange("reference", event.target.value)
                  }
                  placeholder={labels.reference}
                  className="border-outline-variant rounded-xl border px-4 py-3"
                />
              </div>
            </section>

            <DeliveryMap
              mapPin={mapPin}
              onChange={onMapPinChange}
              labels={{ title: labels.mapTitle, hint: labels.mapHint }}
            />

            {!covered ? (
              <p className="font-body text-body-md text-error">
                {labels.outOfCoverage}
              </p>
            ) : null}
            {errorMessage ? (
              <p className="font-body text-body-md text-error">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <aside className="space-y-4">
            {stockMessages.length > 0 ? (
              <div className="bg-error-container rounded-2xl px-4 py-3">
                <p className="font-label text-label-bold text-on-error-container mb-2">
                  {labels.stockTitle}
                </p>
                <ul className="font-body text-body-sm text-on-error-container space-y-1">
                  {stockMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="border-outline-variant rounded-2xl border px-6 py-4">
              <div className="font-body text-body-md text-on-surface-variant mb-2 flex justify-between">
                <span>{labels.subtotal}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="font-body text-body-md text-on-surface-variant mb-4 flex justify-between">
                <span>{labels.shipping}</span>
                <span>{formatPrice(shippingTotal)}</span>
              </div>
              <div className="font-label text-label-bold text-on-surface mb-4 flex justify-between">
                <span>{labels.total}</span>
                <span className="font-display text-price-display text-primary">
                  {formatPrice(total)}
                </span>
              </div>
              <button
                type="submit"
                disabled={!canSubmit}
                className="press-down bg-primary font-label text-label-bold text-on-primary w-full rounded-full px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? labels.submitting : labels.submit}
              </button>
            </div>
          </aside>
        </form>
      </section>
    </StorefrontLayout>
  );
}
