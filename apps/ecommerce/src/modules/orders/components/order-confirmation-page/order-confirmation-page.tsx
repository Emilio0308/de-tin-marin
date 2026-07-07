import Link from "next/link";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import {
  GuestOrderDetailView,
  PaymentInstructions,
} from "../guest-order-detail/guest-order-detail";
import { hasConfirmationLookupParams } from "./order-confirmation-page.helpers";
import type { OrderConfirmationPageProps } from "./order-confirmation-page.types";

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
      <section className="container-max px-gutter py-section-lg">
        <h1 className="font-display text-display-md-mobile text-on-surface md:text-display-md mb-4 text-center">
          {labels.title}
        </h1>

        {orderNumber ? (
          <p className="font-body text-body-lg text-on-surface mb-8 text-center">
            {labels.orderNumber}
          </p>
        ) : null}

        {!canLookup ? (
          <p className="font-body text-body-md text-on-surface-variant text-center">
            {labels.missingParams}
          </p>
        ) : null}

        {showLoading ? (
          <p className="font-body text-body-md text-on-surface-variant text-center">
            {labels.loading}
          </p>
        ) : null}

        {canLookup && errorMessage ? (
          <div className="mx-auto max-w-xl space-y-4 text-center">
            <p className="font-body text-body-md text-error">{errorMessage}</p>
            <Link
              href={`/mis-pedidos?orderNumber=${encodeURIComponent(orderNumber ?? "")}&email=${encodeURIComponent(email ?? "")}`}
              className="font-label text-label-bold text-primary hover:text-secondary inline-block"
            >
              {labels.lookupLink}
            </Link>
          </div>
        ) : null}

        {order ? (
          <div className="mx-auto grid max-w-3xl gap-8">
            <GuestOrderDetailView order={order} labels={labels.detail} />
            {order.status === "pending_payment" ? (
              <PaymentInstructions labels={labels.payment} />
            ) : null}
          </div>
        ) : null}
      </section>
    </StorefrontLayout>
  );
}
