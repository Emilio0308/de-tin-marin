"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Candy,
  Gift,
  MapPin,
  Receipt,
  ShoppingBag,
  Truck,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { OrderStatus } from "@de-tin-marin/shared/order-cart";
import { Button } from "@de-tin-marin/ui/button";
import { OrderLocationMap } from "../order-location-map/order-location-map.dynamic";
import { parseOrderMapPin } from "../order-location-map/order-location-map.helpers";
import {
  orderStatusBadgeClass,
  paymentStatusBadgeClass,
  statusBadgeClassName,
} from "../order-status-badge/order-status-badge.helpers";
import {
  ORDER_STEPPER_STATUSES,
  SHIPMENT_STATUSES,
  type OrderDetailViewProps,
} from "./order-detail.types";

const cardClass =
  "bg-surface-container-lowest border-outline-variant/40 flex flex-col rounded-xl border p-5 shadow-sm md:p-6";

const labelClass =
  "font-label text-label-bold text-on-surface-variant mb-1.5 block text-xs uppercase tracking-wide";

const fieldClass =
  "border-outline-variant/40 focus:border-secondary bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors";

const paymentFieldClass =
  "border-outline-variant/50 focus:border-secondary bg-surface w-full rounded-lg border-2 p-2.5 text-sm outline-none transition-colors";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="text-tertiary mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <h3 className="font-label text-label-bold text-sm uppercase tracking-wider">
        {title}
      </h3>
    </div>
  );
}

function stepperIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  const index = ORDER_STEPPER_STATUSES.indexOf(status);
  return index >= 0 ? index : 0;
}

function OrderStatusStepper({
  currentStatus,
  labels,
}: {
  currentStatus: OrderStatus;
  labels: Record<string, string>;
}) {
  if (currentStatus === "cancelled") return null;

  const activeIndex = stepperIndex(currentStatus);

  return (
    <ol className="flex flex-wrap items-center gap-2 md:gap-0">
      {ORDER_STEPPER_STATUSES.map((status, index) => {
        const isActive = index === activeIndex;
        const isComplete = index < activeIndex;
        const isLast = index === ORDER_STEPPER_STATUSES.length - 1;

        return (
          <li
            key={status}
            className={cn("flex items-center", !isLast && "md:flex-1")}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-label text-label-bold flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs",
                  isActive &&
                    "bg-primary text-on-primary ring-primary/30 ring-4",
                  isComplete &&
                    "bg-secondary-container text-on-secondary-container",
                  !isActive &&
                    !isComplete &&
                    "bg-surface-container-high text-on-surface-variant",
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "font-label text-label-bold hidden text-xs sm:inline",
                  isActive ? "text-on-surface" : "text-on-surface-variant",
                )}
              >
                {labels[status] ?? status}
              </span>
            </div>
            {!isLast ? (
              <div
                className={cn(
                  "mx-2 hidden h-0.5 flex-1 md:block",
                  isComplete ? "bg-secondary" : "bg-outline-variant/40",
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

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
  const mapPin = parseOrderMapPin(order.metadata);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-on-surface-variant font-mono text-sm">
            {order.orderId}
          </p>
          <h1 className="font-display text-on-surface mt-1 text-[32px] font-extrabold leading-10 tracking-tight lg:text-[40px]">
            {labels.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={statusBadgeClassName(
                orderStatusBadgeClass(order.status),
              )}
            >
              {labels.statusLabels[order.status] ?? order.status}
            </span>
            <span
              className={statusBadgeClassName(
                paymentStatusBadgeClass(order.paymentStatus),
              )}
            >
              {labels.paymentStatus}:{" "}
              {labels.paymentStatusLabels[order.paymentStatus] ??
                order.paymentStatus}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/orders">
            <Button variant="secondary" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {labels.back}
            </Button>
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

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {order.status !== "cancelled" ? (
            <section className={cardClass}>
              <OrderStatusStepper
                currentStatus={order.status as OrderStatus}
                labels={labels.stepperLabels}
              />
            </section>
          ) : null}

          {nextStatuses.length > 0 && onTransitionStatus ? (
            <section className={cardClass}>
              <h2 className="font-display text-on-surface mb-4 text-lg font-bold">
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
            <div className={cardClass}>
              <SectionHeader icon={User} title={labels.customer} />
              <p className="font-label text-label-bold text-on-surface text-lg">
                {order.customer.name} {order.customer.lastName}
              </p>
              <p className="text-on-surface-variant mt-2 text-sm">
                {order.customer.phone}
              </p>
              <p className="text-on-surface-variant text-sm">
                {order.customer.email}
              </p>
            </div>
            <div className={cardClass}>
              <SectionHeader icon={MapPin} title={labels.delivery} />
              <p className="font-label text-label-bold text-on-surface text-sm">
                {order.fulfillment.method === "pickup"
                  ? labels.pickupMethod
                  : labels.deliveryMethod}
              </p>
              {order.fulfillment.deliveryAddress ? (
                <div className="text-on-surface-variant mt-2 space-y-1 text-sm">
                  <p>{order.fulfillment.deliveryAddress.recipientName}</p>
                  <p>{order.fulfillment.deliveryAddress.line1}</p>
                  <p>
                    {order.fulfillment.deliveryAddress.district},{" "}
                    {order.fulfillment.deliveryAddress.city},{" "}
                    {order.fulfillment.deliveryAddress.province}
                  </p>
                  {order.fulfillment.deliveryAddress.reference ? (
                    <p className="bg-surface-container-low mt-2 rounded-lg p-2 italic">
                      {labels.referencePrefix}:{" "}
                      {order.fulfillment.deliveryAddress.reference}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <section className={cardClass}>
            <OrderLocationMap
              mapPin={mapPin}
              fulfillmentMethod={order.fulfillment.method}
              labels={{
                title: labels.mapTitle,
                hint: labels.mapHint,
                unavailable: labels.mapUnavailable,
              }}
            />
          </section>

          <section className={cardClass}>
            <SectionHeader icon={ShoppingBag} title={labels.cart} />
            <div className="flex flex-col gap-4">
              {order.shoppingCart.lines.map((line, index) =>
                line.type === "product" ? (
                  <div
                    key={`product-${line.productId}-${index}`}
                    className="border-outline-variant/50 bg-surface flex items-center justify-between gap-4 rounded-lg border p-4"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="bg-primary-fixed-dim/20 border-primary-fixed flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                        <Candy className="text-primary h-7 w-7" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="font-label text-label-bold text-on-surface truncate">
                          {line.name}
                        </p>
                        <p className="text-on-surface-variant text-sm">
                          {labels.formatQuantityLabel(line.quantity)}
                        </p>
                      </div>
                    </div>
                    <p className="font-display text-primary shrink-0 text-lg font-extrabold">
                      S/ {line.lineTotal.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div
                    key={`bundle-${line.bundleId}-${index}`}
                    className="border-primary-fixed-dim from-primary-fixed/30 to-secondary-fixed/30 relative flex items-center justify-between gap-4 overflow-hidden rounded-lg border bg-gradient-to-r p-4"
                  >
                    <div
                      className="pointer-events-none absolute right-0 top-0 h-32 w-32 opacity-20"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle, #db2670 2px, transparent 2px), radial-gradient(circle, #006874 2px, transparent 2px)",
                        backgroundSize: "16px 16px",
                        backgroundPosition: "0 0, 8px 8px",
                      }}
                      aria-hidden
                    />
                    <div className="relative z-10 flex min-w-0 items-center gap-4">
                      <div className="border-primary bg-surface-container-lowest flex h-16 w-16 shrink-0 items-center justify-center rounded-md border-2 border-dashed p-1">
                        <div className="bg-tertiary-fixed flex h-full w-full items-center justify-center rounded">
                          <Gift className="text-tertiary h-7 w-7" aria-hidden />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-label text-label-bold text-on-surface truncate">
                            {line.name}
                          </p>
                          <span className="bg-primary text-on-primary rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase">
                            {labels.surpriseLine}
                          </span>
                        </div>
                        <p className="text-on-surface-variant text-sm">
                          {labels.formatQuantityLabel(line.quantity)}
                        </p>
                      </div>
                    </div>
                    <p className="font-display text-primary relative z-10 shrink-0 text-lg font-extrabold">
                      S/ {line.lineTotal.toFixed(2)}
                    </p>
                  </div>
                ),
              )}
            </div>
          </section>
        </div>

        {/* Columna derecha — Resumen, Pago, Historial, Envío */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <aside className={cn(cardClass, "lg:sticky lg:top-8")}>
            <h3 className="font-label text-label-bold text-on-surface border-outline-variant/40 mb-6 border-b pb-2 text-sm uppercase tracking-wider">
              {labels.summaryTitle}
            </h3>
            <div className="text-on-surface-variant mb-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>{labels.subtotal}</span>
                <span className="font-label text-label-bold text-on-surface">
                  S/ {order.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{labels.discount}</span>
                <span className="font-label text-label-bold text-on-surface">
                  S/ {order.discountTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{labels.shipping}</span>
                <span className="font-label text-label-bold text-on-surface">
                  S/ {order.shippingTotal.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="border-outline-variant/40 mb-6 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-label text-label-bold text-on-surface">
                  {labels.total}
                </span>
                <span className="font-display text-primary text-2xl font-extrabold">
                  S/ {order.total.toFixed(2)}
                </span>
              </div>
              <p className="text-on-surface-variant mt-1 text-right text-xs">
                {labels.taxesIncluded}
              </p>
            </div>
            {order.stockCheck && !order.stockCheck.ok ? (
              <div
                className="border-error/30 bg-error-container flex items-start gap-2 rounded-lg border p-3"
                role="alert"
              >
                <AlertTriangle
                  className="text-error mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                <p className="font-label text-label-bold text-on-error-container text-xs leading-tight">
                  {labels.stockWarningBanner}
                </p>
              </div>
            ) : null}
          </aside>

          {order.status === "pending_payment" && onConfirmPayment ? (
            <section className={cardClass}>
              <SectionHeader icon={Receipt} title={labels.paymentPanelTitle} />
              {order.stockCheck && !order.stockCheck.ok ? (
                <div
                  className="border-error/30 bg-error-container/40 text-on-error-container mb-4 rounded-lg border p-3 text-sm"
                  role="alert"
                >
                  <p className="font-label text-label-bold">
                    {labels.stockWarningTitle}
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    {order.stockCheck.shortages.map((shortage) => (
                      <li key={`${shortage.kind}-${shortage.id}`}>
                        {labels.formatStockWarningItem({
                          sku: shortage.sku,
                          required: shortage.required,
                          available: shortage.available,
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="space-y-4">
                <Field label={labels.paymentReference}>
                  <input
                    className={paymentFieldClass}
                    value={paymentReference}
                    onChange={(event) =>
                      onPaymentReferenceChange(event.target.value)
                    }
                    placeholder={labels.paymentReferencePlaceholder}
                  />
                </Field>
                <Field label={labels.paymentNotes}>
                  <textarea
                    className={cn(paymentFieldClass, "resize-none")}
                    rows={2}
                    value={paymentNotes}
                    onChange={(event) =>
                      onPaymentNotesChange(event.target.value)
                    }
                  />
                </Field>
                <Button
                  variant="secondary"
                  disabled={confirmingPayment}
                  className="w-full"
                  onClick={onConfirmPayment}
                >
                  {confirmingPayment
                    ? labels.confirmingPayment
                    : labels.confirmPayment}
                </Button>
              </div>
            </section>
          ) : null}

          <section className={cardClass}>
            <h3 className="font-label text-label-bold text-on-surface mb-4 text-sm uppercase tracking-wider">
              {labels.paymentHistory}
            </h3>
            {order.payments.length === 0 ? (
              <p className="text-on-surface-variant text-sm">
                {labels.noPayments}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {order.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="border-outline-variant/50 bg-surface flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-label text-label-bold text-on-surface text-sm">
                        {payment.notes ||
                          labels.paymentStatusLabels[payment.status] ||
                          payment.status}
                      </p>
                      {payment.confirmedAt ? (
                        <p className="text-on-surface-variant text-xs">
                          {new Date(payment.confirmedAt).toLocaleString(
                            "es-PE",
                          )}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-label text-label-bold text-secondary text-sm">
                        S/ {payment.amount.toFixed(2)}
                      </p>
                      {payment.status === "confirmed" &&
                      onRefundPayment &&
                      confirmedPayment?.id === payment.id ? (
                        <button
                          type="button"
                          className="text-primary mt-1 text-xs font-bold hover:underline disabled:opacity-50"
                          disabled={refundingPaymentId === payment.id}
                          onClick={() => onRefundPayment(payment.id)}
                        >
                          {refundingPaymentId === payment.id
                            ? labels.refundingPayment
                            : labels.refundPayment}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {order.status !== "pending_payment" &&
          order.status !== "cancelled" ? (
            <section className={cardClass}>
              <SectionHeader icon={Truck} title={labels.shipmentPanelTitle} />
              <div className="space-y-4">
                <Field label={labels.shipmentStatus}>
                  <select
                    className={fieldClass}
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
                    className={fieldClass}
                    value={shipmentCarrier}
                    onChange={(event) =>
                      onShipmentCarrierChange(event.target.value)
                    }
                  />
                </Field>
                <Field label={labels.shipmentTracking}>
                  <input
                    className={fieldClass}
                    value={shipmentTracking}
                    onChange={(event) =>
                      onShipmentTrackingChange(event.target.value)
                    }
                  />
                </Field>
                <Field label={labels.shipmentNotes}>
                  <textarea
                    className={cn(fieldClass, "min-h-[4.5rem] resize-none")}
                    rows={2}
                    value={shipmentNotes}
                    onChange={(event) =>
                      onShipmentNotesChange(event.target.value)
                    }
                  />
                </Field>
                {onSaveShipment ? (
                  <Button
                    variant="secondary"
                    disabled={savingShipment}
                    className="w-full"
                    onClick={onSaveShipment}
                  >
                    {savingShipment
                      ? labels.savingShipment
                      : labels.saveShipment}
                  </Button>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
