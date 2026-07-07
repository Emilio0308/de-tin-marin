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

export function PaymentInstructions({ labels }: PaymentInstructionsProps) {
  return (
    <section className="bg-surface-container rounded-2xl px-6 py-5 text-left">
      <h2 className="font-label text-label-bold text-on-surface mb-3">
        {labels.title}
      </h2>
      <ul className="font-body text-body-md text-on-surface-variant space-y-2">
        <li>{labels.yape}</li>
        <li>{labels.transfer}</li>
      </ul>
      <p className="font-body text-body-sm text-on-surface-variant mt-4">
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
    <div className="space-y-6 text-left">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="font-body text-body-sm text-on-surface-variant">
            {labels.status}
          </p>
          <p className="font-label text-label-bold text-on-surface">
            {labels.formatStatus(order.status)}
          </p>
        </div>
        <div>
          <p className="font-body text-body-sm text-on-surface-variant">
            {labels.paymentStatus}
          </p>
          <p className="font-label text-label-bold text-on-surface">
            {labels.formatPaymentStatus(order.paymentStatus)}
          </p>
        </div>
      </div>

      <p className="font-body text-body-sm text-on-surface-variant">
        {formatGuestOrderDate(order.createdAt)}
      </p>

      <section className="border-outline-variant rounded-2xl border px-4 py-4">
        <h2 className="font-label text-label-bold text-on-surface mb-3">
          {resolveFulfillmentTitle(order.fulfillment.method, labels)}
        </h2>
        {deliveryAddress ? (
          <p className="font-body text-body-md text-on-surface-variant">
            {deliveryAddress}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="font-label text-label-bold text-on-surface mb-3">
          {labels.linesTitle}
        </h2>
        <ul className="space-y-3">
          {lineSummaries.map((line) => (
            <li
              key={line.key}
              className="border-outline-variant flex items-start justify-between gap-4 rounded-2xl border px-4 py-3"
            >
              <div>
                <p className="font-label text-label-bold text-on-surface">
                  {line.name}
                </p>
                <p className="font-body text-body-sm text-on-surface-variant">
                  {line.detail}
                </p>
              </div>
              <p className="font-display text-price-display text-primary">
                {formatPrice(line.lineTotal)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-outline-variant rounded-2xl border px-4 py-4">
        <div className="font-body text-body-md text-on-surface-variant mb-2 flex justify-between">
          <span>{labels.subtotal}</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="font-body text-body-md text-on-surface-variant mb-4 flex justify-between">
          <span>{labels.shipping}</span>
          <span>{formatPrice(order.shippingTotal)}</span>
        </div>
        <div className="font-label text-label-bold text-on-surface flex justify-between">
          <span>{labels.total}</span>
          <span className="font-display text-price-display text-primary">
            {formatPrice(order.total)}
          </span>
        </div>
      </section>
    </div>
  );
}
