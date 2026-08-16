import type { ComponentType, ReactNode } from "react";
import {
  Banknote,
  CircleCheck,
  Clock3,
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

const ORDER_PROGRESS = [
  "pending_payment",
  "paid",
  "preparing",
  "ready",
  "delivered",
] as const;

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
      className={`border-outline-variant/30 bg-surface-container-lowest space-y-4 rounded-3xl border p-4 shadow-sm md:p-6 ${className}`}
    >
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className="bg-primary-fixed text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        ) : null}
        <h2 className="font-label text-label-bold text-on-surface">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function PaymentInstructions({ labels }: PaymentInstructionsProps) {
  return (
    <section className="border-secondary/25 bg-secondary-container/25 space-y-4 rounded-3xl border p-4 md:p-6">
      <div className="flex items-center gap-2">
        <CreditCard className="text-secondary h-5 w-5 shrink-0" aria-hidden />
        <h2 className="font-label text-label-bold text-on-surface">
          {labels.title}
        </h2>
      </div>

      <div className="space-y-3">
        <div className="bg-surface-container-lowest flex gap-3 rounded-2xl p-4 shadow-sm">
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

        <div className="bg-surface-container-lowest flex gap-3 rounded-2xl p-4 shadow-sm">
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

      <p className="font-body text-body-sm text-on-surface-variant border-outline-variant/30 bg-surface-container-lowest/80 rounded-2xl border px-4 py-3">
        {labels.note}
      </p>
    </section>
  );
}

function resolveProgressIndex(status: string): number {
  if (status === "completed") return ORDER_PROGRESS.length - 1;
  return ORDER_PROGRESS.indexOf(status as (typeof ORDER_PROGRESS)[number]);
}

function OrderProgress({
  status,
  labels,
}: {
  status: string;
  labels: GuestOrderDetailProps["labels"];
}) {
  const progressIndex = resolveProgressIndex(status);

  if (status === "cancelled") {
    return (
      <div className="border-error/30 bg-error-container text-on-error-container rounded-2xl border px-4 py-3">
        <p className="font-label text-label-bold">
          {labels.formatStatus(status)}
        </p>
      </div>
    );
  }

  return (
    <section aria-label={labels.progressTitle}>
      <p className="font-label text-label-bold text-on-surface mb-4">
        {labels.progressTitle}
      </p>
      <ol className="grid grid-cols-5 gap-1">
        {ORDER_PROGRESS.map((step, index) => {
          const isComplete = progressIndex >= index;
          const isCurrent = progressIndex === index;

          return (
            <li key={step} className="min-w-0">
              <div className="flex items-center">
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  className={
                    isComplete
                      ? "bg-secondary text-on-secondary flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      : "bg-surface-container-high text-on-surface-variant flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  }
                >
                  {isComplete ? (
                    <CircleCheck className="h-4 w-4" aria-hidden />
                  ) : (
                    <Clock3 className="h-4 w-4" aria-hidden />
                  )}
                </span>
                {index < ORDER_PROGRESS.length - 1 ? (
                  <span
                    aria-hidden
                    className={
                      progressIndex > index
                        ? "bg-secondary h-0.5 min-w-1 flex-1"
                        : "bg-outline-variant/50 h-0.5 min-w-1 flex-1"
                    }
                  />
                ) : null}
              </div>
              <p
                className={
                  isCurrent
                    ? "font-label text-primary mt-2 pr-1 text-[11px] leading-tight"
                    : "font-body text-on-surface-variant mt-2 pr-1 text-[11px] leading-tight"
                }
              >
                {labels.formatStatus(step)}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function GuestOrderDetailView({ order, labels }: GuestOrderDetailProps) {
  const lineSummaries = summarizeGuestOrderLines(order, {
    bundleComponents: labels.bundleComponents,
    packComponents: labels.packComponents,
    formatBundlePersons: labels.formatBundlePersons,
  });
  const deliveryAddress = formatDeliveryAddress(order);

  return (
    <div className="space-y-5">
      <section className="border-outline-variant/30 soft-glow-pink bg-surface-container-lowest rounded-4xl overflow-hidden border shadow-sm">
        <div className="from-primary via-secondary to-tertiary bg-linear-to-r h-1.5" />
        <div className="space-y-6 p-5 md:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="font-body text-body-sm text-on-surface-variant">
                {labels.orderPlaced}
              </p>
              <p className="font-display text-headline-md text-on-surface">
                {order.orderNumber}
              </p>
              <p className="font-body text-body-sm text-on-surface-variant">
                {labels.dateLabel}: {formatGuestOrderDate(order.createdAt)}
              </p>
            </div>
            <div className="bg-primary-fixed text-on-primary-fixed-variant rounded-2xl px-4 py-3 sm:text-right">
              <p className="font-body text-body-xs">{labels.statusCurrent}</p>
              <p className="font-label text-label-bold">
                {labels.formatStatus(order.status)}
              </p>
            </div>
          </div>

          <OrderProgress status={order.status} labels={labels} />

          <div className="border-outline-variant/20 grid gap-3 border-t pt-4 sm:grid-cols-2">
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
              {order.paymentStatus === "pending" ? (
                <p className="font-body text-body-sm text-on-surface-variant">
                  {labels.paymentPendingHint}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-5">
          {deliveryAddress ? (
            <OrderDetailCard
              title={resolveFulfillmentTitle(order.fulfillment.method, labels)}
              icon={MapPin}
            >
              <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
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
                      ? "surprise-card-border flex items-start justify-between gap-4 rounded-2xl px-4 py-4"
                      : "border-outline-variant/40 bg-surface-container-low flex items-start justify-between gap-4 rounded-2xl border px-4 py-4"
                  }
                >
                  <div className="min-w-0 space-y-1.5">
                    {line.kind === "bundle" ? (
                      <span className="bg-secondary-container text-on-secondary-container font-label text-label-bold inline-block rounded-full px-3 py-1 text-xs">
                        {labels.bundleBadge}
                      </span>
                    ) : null}
                    {line.kind === "pack" ? (
                      <span className="bg-tertiary-container text-on-tertiary-container font-label text-label-bold inline-block rounded-full px-3 py-1 text-xs">
                        {labels.packBadge}
                      </span>
                    ) : null}
                    <p className="font-label text-label-bold text-on-surface">
                      {line.name}
                    </p>
                    <p className="font-body text-body-sm text-on-surface-variant">
                      {line.detail}
                    </p>
                  </div>
                  <p className="font-display text-primary shrink-0 text-[22px] font-extrabold">
                    {formatPrice(line.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
          </OrderDetailCard>
        </div>

        <section className="border-outline-variant/30 bg-surface-container-lowest soft-glow-pink space-y-4 rounded-3xl border p-5 shadow-sm lg:sticky lg:top-28">
          <p className="font-label text-label-bold text-on-surface">
            {labels.linesTitle}
          </p>
          <div className="font-body text-body-md text-on-surface-variant flex justify-between">
            <span>{labels.subtotal}</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="font-body text-body-md text-on-surface-variant flex justify-between">
            <span>{labels.shipping}</span>
            <span>{formatPrice(order.shippingTotal)}</span>
          </div>
          <div className="border-outline-variant/20 flex items-end justify-between border-t pt-4">
            <span className="font-label text-label-bold text-on-surface">
              {labels.total}
            </span>
            <span className="font-display text-price-display text-primary">
              {formatPrice(order.total)}
            </span>
          </div>
        </section>
      </div>
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
