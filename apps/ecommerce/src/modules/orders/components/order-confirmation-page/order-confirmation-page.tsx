import Link from "next/link";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import {
  GuestOrderDetailView,
  OrderConfirmationSuccessIcon,
  PaymentInstructions,
} from "../guest-order-detail/guest-order-detail";
import { hasConfirmationLookupParams } from "./order-confirmation-page.helpers";
import type { OrderConfirmationPageProps } from "./order-confirmation-page.types";

function OrderConfirmationSkeleton() {
  return (
    <div
      className="mx-auto max-w-3xl space-y-4"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="bg-surface-container mx-auto h-16 w-16 animate-pulse rounded-full" />
      <div className="bg-surface-container mx-auto h-8 w-64 animate-pulse rounded" />
      <div className="bg-surface-container mx-auto h-5 w-48 animate-pulse rounded" />
      <div className="bg-surface-container h-28 animate-pulse rounded-2xl" />
      <div className="bg-surface-container h-40 animate-pulse rounded-2xl" />
    </div>
  );
}

export function OrderConfirmationPage({
  orderNumber,
  email,
  order,
  isLoading,
  errorMessage,
  labels,
}: OrderConfirmationPageProps) {
  const canLookup = hasConfirmationLookupParams(orderNumber, email);
  const showLoading = canLookup && isLoading && !order;

  return (
    <StorefrontLayout>
      <section className="pt-stack-md md:pt-stack-lg pb-stack-lg md:pb-section-lg relative overflow-hidden">
        <div
          className="bg-primary-fixed pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full opacity-35 blur-3xl"
          aria-hidden
        />
        <div
          className="bg-secondary-fixed pointer-events-none absolute -bottom-10 -right-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
          aria-hidden
        />
        <div className="container-max px-gutter relative z-10">
          <div className="space-y-stack-md mx-auto max-w-5xl">
            <div className="border-outline-variant/30 bg-surface-container-lowest soft-glow-pink rounded-4xl mx-auto max-w-3xl border px-6 py-8 text-center shadow-sm md:px-10 md:py-10">
              <OrderConfirmationSuccessIcon />

              <div className="mt-5 space-y-2">
                <h1 className="font-display text-display-lg-mobile text-primary md:text-display-lg">
                  {labels.title}
                </h1>
                {orderNumber ? (
                  <p className="font-body text-body-lg text-on-surface">
                    {labels.orderNumber}
                  </p>
                ) : null}
              </div>
            </div>

            {!canLookup ? (
              <div className="border-outline-variant/30 bg-surface-container-lowest mx-auto max-w-xl space-y-4 rounded-2xl border p-6 shadow-sm">
                <p className="font-body text-body-md text-on-surface-variant">
                  {labels.missingParams}
                </p>
                <Link
                  href="/mis-pedidos"
                  className="font-label text-label-bold text-primary hover:text-secondary inline-block"
                >
                  {labels.lookupLink}
                </Link>
              </div>
            ) : null}

            {showLoading ? <OrderConfirmationSkeleton /> : null}

            {canLookup && errorMessage ? (
              <div className="border-error/30 bg-error-container mx-auto max-w-xl space-y-4 rounded-2xl border p-6 text-left">
                <p className="font-body text-body-md text-on-error-container">
                  {errorMessage}
                </p>
                <Link
                  href={`/mis-pedidos?orderNumber=${encodeURIComponent(orderNumber ?? "")}&email=${encodeURIComponent(email ?? "")}`}
                  className="font-label text-label-bold text-primary hover:text-secondary inline-block"
                >
                  {labels.lookupLink}
                </Link>
              </div>
            ) : null}

            {order ? (
              <div className="space-y-4 text-left">
                <GuestOrderDetailView order={order} labels={labels.detail} />
                {order.status === "pending_payment" ? (
                  <PaymentInstructions labels={labels.payment} />
                ) : null}
              </div>
            ) : null}

            {order ? (
              <div className="flex flex-col items-center gap-3 pt-2">
                <Link
                  href={`/mis-pedidos?orderNumber=${encodeURIComponent(orderNumber ?? "")}&email=${encodeURIComponent(email ?? "")}`}
                  className="font-label text-label-bold text-primary hover:bg-primary-fixed/40 focus-visible:ring-primary inline-flex min-h-11 items-center rounded-full px-4 transition-colors focus-visible:outline-none focus-visible:ring-2"
                >
                  {labels.lookupLink}
                </Link>
                <Link
                  href="/?tab=productos"
                  className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container focus-visible:ring-primary inline-flex min-h-12 items-center justify-center rounded-full px-8 py-3 transition-[transform,background-color] duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2"
                >
                  {labels.continueShopping}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
