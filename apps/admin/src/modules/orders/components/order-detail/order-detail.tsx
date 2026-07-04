"use client";

import Link from "next/link";
import { Badge } from "@de-tin-marin/ui/badge";
import { Button } from "@de-tin-marin/ui/button";
import type { OrderDetail } from "@de-tin-marin/validations/order";
import { ORDER_STATUS_LABELS } from "../order-list/order-list.types";

type OrderDetailViewProps = {
  order: OrderDetail;
  onCancel?: () => void;
  cancelling?: boolean;
};

export function OrderDetailView({
  order,
  onCancel,
  cancelling,
}: OrderDetailViewProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">{order.orderId}</p>
          <h1 className="text-3xl font-bold">Orden</h1>
          <div className="mt-2 flex gap-2">
            <Badge variant="muted">
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </Badge>
            <Badge variant="muted">Pago: {order.paymentStatus}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/orders">
            <Button variant="secondary">Volver</Button>
          </Link>
          {order.status === "pending_payment" && onCancel ? (
            <Button
              variant="secondary"
              disabled={cancelling}
              onClick={onCancel}
            >
              {cancelling ? "Cancelando…" : "Cancelar orden"}
            </Button>
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Cliente</h2>
          <p>
            {order.customer.name} {order.customer.lastName}
          </p>
          <p className="text-sm text-zinc-600">{order.customer.phone}</p>
          <p className="text-sm text-zinc-600">{order.customer.email}</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Entrega</h2>
          <p className="capitalize">{order.fulfillment.method}</p>
          {order.fulfillment.deliveryAddress ? (
            <div className="mt-2 text-sm text-zinc-600">
              <p>{order.fulfillment.deliveryAddress.recipientName}</p>
              <p>{order.fulfillment.deliveryAddress.line1}</p>
              <p>
                {order.fulfillment.deliveryAddress.district},{" "}
                {order.fulfillment.deliveryAddress.city}
              </p>
              {order.fulfillment.deliveryAddress.reference ? (
                <p>Ref: {order.fulfillment.deliveryAddress.reference}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-4 font-semibold">Order shopping cart</h2>
        <div className="flex flex-col gap-4">
          {order.shoppingCart.lines.map((line, index) =>
            line.type === "product" ? (
              <div
                key={`product-${line.productId}-${index}`}
                className="rounded border p-3"
              >
                <p className="font-medium">{line.name}</p>
                <p className="text-sm text-zinc-600">
                  {line.quantity} × S/ {line.unitPrice.toFixed(2)} = S/{" "}
                  {line.lineTotal.toFixed(2)}
                </p>
              </div>
            ) : (
              <div
                key={`bundle-${line.bundleId}-${index}`}
                className="rounded border p-3"
              >
                <p className="font-medium">{line.name} (sorpresa)</p>
                <p className="text-sm text-zinc-600">
                  {line.quantity} sorpresas · fee S/{" "}
                  {line.serviceFee.toFixed(2)} · total S/{" "}
                  {line.lineTotal.toFixed(2)}
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600">
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

      <section className="rounded-lg border p-4 md:ml-auto md:w-80">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>S/ {order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Descuento</span>
          <span>S/ {order.discountTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Envío</span>
          <span>S/ {order.shippingTotal.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>S/ {order.total.toFixed(2)}</span>
        </div>
      </section>
    </div>
  );
}
