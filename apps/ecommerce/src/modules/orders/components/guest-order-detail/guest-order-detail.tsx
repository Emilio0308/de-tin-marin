import type { ComponentType, ReactNode } from "react";
import {
  Banknote,
  CircleCheck,
  CreditCard,
  MapPin,
  Package,
  Smartphone,
} from "lucide-react";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import type {
  GuestOrderDetailProps,
  PaymentInstructionsProps,
} from "./guest-order-detail.types";
import {
  formatDeliveryAddress,
  formatGuestOrderDate,
  resolveFulfillmentTitle,
  summarizeGuestOrderLines,
} from "./guest-order-detail.helpers";

function OrderDetailCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`border-outline-variant/30 bg-surface-container-lowest space-y-3 rounded-2xl border p-4 shadow-sm md:p-5 ${className}`}
    >
      <div className="flex items-center gap-2">
        {Icon ? (
          <Icon className="text-primary h-5 w-5 shrink-0" aria-hidden />
        ) : null}
        <h2 className="font-label text-label-bold text-on-surface">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function PaymentInstructions({ labels }: PaymentInstructionsProps) {
  return (
    <section className="border-secondary/20 bg-secondary-container/30 space-y-4 rounded-2xl border p-4 md:p-5">
      <div className="flex items-center gap-2">
        <CreditCard className="text-secondary h-5 w-5 shrink-0" aria-hidden />
        <h2 className="font-label text-label-bold text-on-surface">
          {labels.title}
        </h2>
      </div>

      <div className="space-y-3">
        <div className="bg-surface-container-lowest flex gap-3 rounded-xl p-3">
          <Smartphone
            className="text-primary mt-0.5 h-5 w-5 shrink-0"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="font-label text-label-bold text-on-surface">
              {labels.yapeLabel}
            </p>
            <p className="font-body text-body-md text-on-surface-variant">
              {labels.yape}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest flex gap-3 rounded-xl p-3">
          <Banknote
            className="text-primary mt-0.5 h-5 w-5 shrink-0"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="font-label text-label-bold text-on-surface">
              {labels.transferLabel}
            </p>
            <p className="font-body text-body-md text-on-surface-variant">
              {labels.transfer}
            </p>
          </div>
        </div>
      </div>

      <p className="font-body text-body-sm text-on-surface-variant border-outline-variant/30 rounded-xl border bg-white/70 px-3 py-2">
        {labels.note}
      </p>
    </section>
  );
}

export function GuestOrderDetailView({ order, labels }: GuestOrderDetailProps) {
  const lineSummaries = summarizeGuestOrderLines(order, {
    bundleComponents: labels.bundleComponents,
    formatBundlePersons: labels.formatBundlePersons,
  });
  const deliveryAddress = formatDeliveryAddress(order);

  return (
    <div className="space-y-4">
      <section className="border-outline-variant/30 bg-surface-container-lowest grid gap-3 rounded-2xl border p-4 shadow-sm sm:grid-cols-2 md:p-5">
        <div className="space-y-1">
          <p className="font-body text-body-sm text-on-surface-variant">
            {labels.status}
          </p>
          <p className="font-label text-label-bold text-on-surface">
            {labels.formatStatus(order.status)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="font-body text-body-sm text-on-surface-variant">
            {labels.paymentStatus}
          </p>
          <p className="font-label text-label-bold text-on-surface">
            {labels.formatPaymentStatus(order.paymentStatus)}
          </p>
        </div>
        <p className="font-body text-body-sm text-on-surface-variant sm:col-span-2">
          {formatGuestOrderDate(order.createdAt)}
        </p>
      </section>

      {deliveryAddress ? (
        <OrderDetailCard
          title={resolveFulfillmentTitle(order.fulfillment.method, labels)}
          icon={MapPin}
        >
          <p className="font-body text-body-md text-on-surface-variant">
            {deliveryAddress}
          </p>
        </OrderDetailCard>
      ) : null}

      <OrderDetailCard title={labels.linesTitle} icon={Package}>
        <ul className="space-y-3">
          {lineSummaries.map((line) => (
            <li
              key={line.key}
              className={
                line.kind === "bundle"
                  ? "surprise-card-border border-outline-variant flex items-start justify-between gap-4 rounded-2xl border px-4 py-3"
                  : "border-outline-variant/40 flex items-start justify-between gap-4 rounded-2xl border px-4 py-3"
              }
            >
              <div className="min-w-0 space-y-1">
                {line.kind === "bundle" ? (
                  <span className="bg-secondary-container text-on-secondary-container font-label text-label-bold inline-block rounded-full px-3 py-1 text-xs">
                    {labels.bundleBadge}
                  </span>
                ) : null}
                <p className="font-label text-label-bold text-on-surface">
                  {line.name}
                </p>
                <p className="font-body text-body-sm text-on-surface-variant">
                  {line.detail}
                </p>
              </div>
              <p className="font-display text-price-display text-primary shrink-0">
                {formatPrice(line.lineTotal)}
              </p>
            </li>
          ))}
        </ul>
      </OrderDetailCard>

      <section className="border-outline-variant/30 bg-surface-container-lowest soft-glow-pink space-y-3 rounded-3xl border p-4 md:p-5">
        <div className="font-body text-body-md text-on-surface-variant flex justify-between">
          <span>{labels.subtotal}</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="font-body text-body-md text-on-surface-variant flex justify-between">
          <span>{labels.shipping}</span>
          <span>{formatPrice(order.shippingTotal)}</span>
        </div>
        <div className="border-outline-variant/20 flex items-end justify-between border-t pt-3">
          <span className="font-label text-label-bold text-on-surface">
            {labels.total}
          </span>
          <span className="font-display text-price-display text-primary">
            {formatPrice(order.total)}
          </span>
        </div>
      </section>
    </div>
  );
}

export function OrderConfirmationSuccessIcon() {
  return (
    <div className="bg-primary-container/30 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
      <CircleCheck className="text-primary h-9 w-9" aria-hidden />
    </div>
  );
}
