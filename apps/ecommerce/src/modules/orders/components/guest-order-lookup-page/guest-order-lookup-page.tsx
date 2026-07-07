import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import {
  GuestOrderDetailView,
  PaymentInstructions,
} from "../guest-order-detail/guest-order-detail";
import { canSubmitGuestOrderLookup } from "./guest-order-lookup-page.helpers";
import type { GuestOrderLookupPageProps } from "./guest-order-lookup-page.types";

export function GuestOrderLookupPage({
  form,
  order,
  isSubmitting,
  errorMessage,
  labels,
  onChange,
  onSubmit,
}: GuestOrderLookupPageProps) {
  const canSubmit = canSubmitGuestOrderLookup(form) && !isSubmitting;

  return (
    <StorefrontLayout>
      <section className="container-max px-gutter py-section-lg">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-display-md-mobile text-on-surface md:text-display-md mb-2 text-center">
            {labels.title}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mb-8 text-center">
            {labels.subtitle}
          </p>

          <form
            className="mb-8 grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <input
              required
              value={form.orderNumber}
              onChange={(event) => onChange("orderNumber", event.target.value)}
              placeholder={labels.orderNumber}
              className="border-outline-variant rounded-xl border px-4 py-3 md:col-span-2"
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder={labels.email}
              className="border-outline-variant rounded-xl border px-4 py-3 md:col-span-2"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="press-down bg-primary font-label text-label-bold text-on-primary rounded-full px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
            >
              {isSubmitting ? labels.submitting : labels.submit}
            </button>
          </form>

          {errorMessage ? (
            <p className="font-body text-body-md text-error mb-8 text-center">
              {errorMessage}
            </p>
          ) : null}

          {order ? (
            <div className="space-y-8">
              <GuestOrderDetailView order={order} labels={labels.detail} />
              {order.status === "pending_payment" ? (
                <PaymentInstructions labels={labels.payment} />
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </StorefrontLayout>
  );
}
