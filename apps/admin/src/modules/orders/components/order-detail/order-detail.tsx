"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { getBundleLineContainerUnitPrice } from "@de-tin-marin/shared/order-cart";
import { Badge } from "@de-tin-marin/ui/badge";
import { Button } from "@de-tin-marin/ui/button";
import {
  SHIPMENT_STATUSES,
  type OrderDetailViewProps,
} from "./order-detail.types";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-on-surface-variant font-medium">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface";

export function OrderDetailView({
  order,
  labels,
  paymentReference,
  paymentNotes,
  onPaymentReferenceChange,
  onPaymentNotesChange,
  onConfirmPayment,
  confirmingPayment,
  onRefundPayment,
  refundingPaymentId,
  shipmentStatus,
  shipmentTracking,
  shipmentCarrier,
  shipmentNotes,
  onShipmentStatusChange,
  onShipmentTrackingChange,
  onShipmentCarrierChange,
  onShipmentNotesChange,
  onSaveShipment,
  savingShipment,
  nextStatuses,
  onTransitionStatus,
  transitioningTo,
  onCancel,
  cancelling,
}: OrderDetailViewProps) {
  const confirmedPayment = order.payments.find(
    (payment) => payment.status === "confirmed",
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-on-surface-variant text-sm">{order.orderId}</p>
          <h1 className="font-display text-on-surface text-3xl font-bold">
            {labels.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="muted">
              {labels.statusLabels[order.status] ?? order.status}
            </Badge>
            <Badge variant="muted">
              {labels.paymentStatus}:{" "}
              {labels.paymentStatusLabels[order.paymentStatus] ??
                order.paymentStatus}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/orders">
            <Button variant="secondary">{labels.back}</Button>
          </Link>
          {order.status === "pending_payment" && onCancel ? (
            <Button
              variant="secondary"
              disabled={cancelling}
              onClick={onCancel}
            >
              {cancelling ? labels.cancelling : labels.cancelOrder}
            </Button>
          ) : null}
        </div>
      </div>

      {nextStatuses.length > 0 && onTransitionStatus ? (
        <section className="border-outline-variant bg-surface-container-low rounded-lg border p-4">
          <h2 className="text-on-surface mb-3 font-semibold">
            {labels.statusActionsTitle}
          </h2>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                disabled={transitioningTo === status}
                onClick={() => onTransitionStatus(status)}
              >
                {transitioningTo === status
                  ? "…"
                  : (labels.statusLabels[status] ?? status)}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="border-outline-variant bg-surface-container-low rounded-lg border p-4">
          <h2 className="text-on-surface font-semibold">{labels.customer}</h2>
          <p className="text-on-surface">
            {order.customer.name} {order.customer.lastName}
          </p>
          <p className="text-on-surface-variant text-sm">
            {order.customer.phone}
          </p>
          <p className="text-on-surface-variant text-sm">
            {order.customer.email}
          </p>
        </div>
        <div className="border-outline-variant bg-surface-container-low rounded-lg border p-4">
          <h2 className="text-on-surface font-semibold">{labels.delivery}</h2>
          <p className="text-on-surface capitalize">
            {order.fulfillment.method}
          </p>
          {order.fulfillment.deliveryAddress ? (
            <div className="text-on-surface-variant mt-2 text-sm">
              <p>{order.fulfillment.deliveryAddress.recipientName}</p>
              <p>{order.fulfillment.deliveryAddress.line1}</p>
              <p>
                {order.fulfillment.deliveryAddress.district},{" "}
                {order.fulfillment.deliveryAddress.city}
              </p>
              {order.fulfillment.deliveryAddress.reference ? (
                <p>
                  {labels.referencePrefix}:{" "}
                  {order.fulfillment.deliveryAddress.reference}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-outline-variant bg-surface-container-low rounded-lg border p-4">
        <h2 className="text-on-surface mb-4 font-semibold">
          {labels.paymentPanelTitle}
        </h2>

        {order.status === "pending_payment" && onConfirmPayment ? (
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Field label={labels.paymentReference}>
              <input
                className={inputClassName}
                value={paymentReference}
                onChange={(event) =>
                  onPaymentReferenceChange(event.target.value)
                }
                placeholder={labels.paymentReferencePlaceholder}
              />
            </Field>
            <Field label={labels.paymentNotes}>
              <input
                className={inputClassName}
                value={paymentNotes}
                onChange={(event) => onPaymentNotesChange(event.target.value)}
              />
            </Field>
            <div className="md:col-span-2">
              <Button disabled={confirmingPayment} onClick={onConfirmPayment}>
                {confirmingPayment
                  ? labels.confirmingPayment
                  : labels.confirmPayment}
              </Button>
            </div>
          </div>
        ) : null}

        <h3 className="text-on-surface-variant mb-2 text-sm font-medium">
          {labels.paymentHistory}
        </h3>
        {order.payments.length === 0 ? (
          <p className="text-on-surface-variant text-sm">{labels.noPayments}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {order.payments.map((payment) => (
              <li
                key={payment.id}
                className="border-outline-variant flex flex-col gap-2 rounded border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-on-surface font-medium">
                    S/ {payment.amount.toFixed(2)} ·{" "}
                    {labels.paymentStatusLabels[payment.status] ??
                      payment.status}
                  </p>
                  {payment.notes ? (
                    <p className="text-on-surface-variant text-sm">
                      {payment.notes}
                    </p>
                  ) : null}
                  {payment.confirmedAt ? (
                    <p className="text-on-surface-variant text-xs">
                      {new Date(payment.confirmedAt).toLocaleString("es-PE")}
                    </p>
                  ) : null}
                </div>
                {payment.status === "confirmed" &&
                onRefundPayment &&
                confirmedPayment?.id === payment.id ? (
                  <Button
                    variant="secondary"
                    disabled={refundingPaymentId === payment.id}
                    onClick={() => onRefundPayment(payment.id)}
                  >
                    {refundingPaymentId === payment.id
                      ? labels.refundingPayment
                      : labels.refundPayment}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {order.status !== "pending_payment" && order.status !== "cancelled" ? (
        <section className="border-outline-variant bg-surface-container-low rounded-lg border p-4">
          <h2 className="text-on-surface mb-4 font-semibold">
            {labels.shipmentPanelTitle}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={labels.shipmentStatus}>
              <select
                className={inputClassName}
                value={shipmentStatus}
                onChange={(event) =>
                  onShipmentStatusChange(
                    event.target.value as typeof shipmentStatus,
                  )
                }
              >
                {SHIPMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {labels.shipmentStatusLabels[status] ?? status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={labels.shipmentCarrier}>
              <input
                className={inputClassName}
                value={shipmentCarrier}
                onChange={(event) =>
                  onShipmentCarrierChange(event.target.value)
                }
              />
            </Field>
            <Field label={labels.shipmentTracking}>
              <input
                className={inputClassName}
                value={shipmentTracking}
                onChange={(event) =>
                  onShipmentTrackingChange(event.target.value)
                }
              />
            </Field>
            <Field label={labels.shipmentNotes}>
              <input
                className={inputClassName}
                value={shipmentNotes}
                onChange={(event) => onShipmentNotesChange(event.target.value)}
              />
            </Field>
            {onSaveShipment ? (
              <div className="md:col-span-2">
                <Button disabled={savingShipment} onClick={onSaveShipment}>
                  {savingShipment ? labels.savingShipment : labels.saveShipment}
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="border-outline-variant bg-surface-container-low rounded-lg border p-4">
        <h2 className="text-on-surface mb-4 font-semibold">{labels.cart}</h2>
        <div className="flex flex-col gap-4">
          {order.shoppingCart.lines.map((line, index) =>
            line.type === "product" ? (
              <div
                key={`product-${line.productId}-${index}`}
                className="border-outline-variant rounded border p-3"
              >
                <p className="text-on-surface font-medium">{line.name}</p>
                <p className="text-on-surface-variant text-sm">
                  {line.quantity} × S/ {line.unitPrice.toFixed(2)} = S/{" "}
                  {line.lineTotal.toFixed(2)}
                </p>
              </div>
            ) : (
              <div
                key={`bundle-${line.bundleId}-${index}`}
                className="border-outline-variant rounded border p-3"
              >
                <p className="text-on-surface font-medium">
                  {line.name} (sorpresa)
                </p>
                <p className="text-on-surface-variant text-sm">
                  {line.quantity} sorpresas · envase S/{" "}
                  {getBundleLineContainerUnitPrice(line).toFixed(2)} · total S/{" "}
                  {line.lineTotal.toFixed(2)}
                </p>
                {line.container ? (
                  <p className="text-on-surface-variant/80 text-xs">
                    {line.container.name} ({line.container.sku})
                  </p>
                ) : null}
                <ul className="text-on-surface-variant mt-2 list-disc pl-5 text-sm">
                  {line.components.map((component) => (
                    <li key={component.productId}>
                      {component.productName}: {component.totalQuantity} u. × S/{" "}
                      {component.unitPrice.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="border-outline-variant bg-surface-container-low rounded-lg border p-4 md:ml-auto md:w-80">
        <div className="text-on-surface-variant flex justify-between text-sm">
          <span>{labels.subtotal}</span>
          <span>S/ {order.subtotal.toFixed(2)}</span>
        </div>
        <div className="text-on-surface-variant flex justify-between text-sm">
          <span>{labels.discount}</span>
          <span>S/ {order.discountTotal.toFixed(2)}</span>
        </div>
        <div className="text-on-surface-variant flex justify-between text-sm">
          <span>{labels.shipping}</span>
          <span>S/ {order.shippingTotal.toFixed(2)}</span>
        </div>
        <div className="text-on-surface mt-2 flex justify-between font-semibold">
          <span>{labels.total}</span>
          <span>S/ {order.total.toFixed(2)}</span>
        </div>
      </section>
    </div>
  );
}
