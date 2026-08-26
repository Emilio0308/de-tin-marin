import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { Mail, PackageSearch, Search, ShieldCheck } from "lucide-react";
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
      <section className="py-stack-lg md:py-section-lg relative overflow-hidden">
        <div
          className="bg-primary-fixed pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
          aria-hidden
        />
        <div
          className="bg-secondary-fixed pointer-events-none absolute -bottom-10 -right-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
          aria-hidden
        />

        <div className="container-max px-gutter pb-stack-md relative z-10">
          <div className="mx-auto max-w-4xl">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <span className="bg-primary-fixed text-on-primary-fixed-variant font-label text-label-bold inline-flex items-center gap-2 rounded-full px-4 py-2">
                <PackageSearch className="h-4 w-4" aria-hidden />
                {labels.lookupTitle}
              </span>
              <h1 className="font-display text-display-md-mobile text-on-surface md:text-display-md mt-4">
                {labels.title}
              </h1>
              <p className="font-body text-body-lg text-on-surface-variant mt-3 leading-relaxed">
                {labels.subtitle}
              </p>
            </div>

            <div className="border-outline-variant/30 bg-surface-container-lowest soft-glow-pink rounded-4xl mx-auto max-w-2xl border p-5 shadow-sm md:p-7">
              <p className="font-body text-body-md text-on-surface-variant mb-5">
                {labels.lookupHint}
              </p>
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmit();
                }}
              >
                <div className="space-y-2">
                  <label
                    htmlFor="order-number"
                    className="font-label text-label-bold text-on-surface"
                  >
                    {labels.orderNumber}
                  </label>
                  <div className="relative">
                    <PackageSearch
                      className="text-primary pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                      aria-hidden
                    />
                    <input
                      id="order-number"
                      required
                      value={form.orderNumber}
                      onChange={(event) =>
                        onChange("orderNumber", event.target.value)
                      }
                      className="border-outline-variant/35 bg-surface-container-low focus:border-secondary focus-visible:ring-secondary/30 font-body text-body-md text-on-surface min-h-12 w-full rounded-2xl border px-12 py-3 focus:outline-none focus-visible:ring-2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="order-email"
                    className="font-label text-label-bold text-on-surface"
                  >
                    {labels.email}
                  </label>
                  <div className="relative">
                    <Mail
                      className="text-primary pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                      aria-hidden
                    />
                    <input
                      id="order-email"
                      required
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) =>
                        onChange("email", event.target.value)
                      }
                      className="border-outline-variant/35 bg-surface-container-low focus:border-secondary focus-visible:ring-secondary/30 font-body text-body-md text-on-surface min-h-12 w-full rounded-2xl border px-12 py-3 focus:outline-none focus-visible:ring-2"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container focus-visible:ring-primary flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 transition-[transform,background-color,opacity] duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Search className="h-5 w-5" aria-hidden />
                  {isSubmitting ? labels.submitting : labels.submit}
                </button>
              </form>

              <p className="font-body text-body-sm text-on-surface-variant mt-5 flex items-start justify-center gap-2 text-center">
                <ShieldCheck
                  className="text-secondary mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                {labels.secureNote}
              </p>
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="border-error/30 bg-error-container text-on-error-container mx-auto mt-6 max-w-2xl rounded-2xl border px-4 py-3 text-center"
              >
                <p className="font-body text-body-md">{errorMessage}</p>
              </div>
            ) : null}

            {order ? (
              <div className="mx-auto mt-10 max-w-5xl space-y-5">
                <GuestOrderDetailView order={order} labels={labels.detail} />
                {order.status === "pending_payment" ? (
                  <PaymentInstructions labels={labels.payment} />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
