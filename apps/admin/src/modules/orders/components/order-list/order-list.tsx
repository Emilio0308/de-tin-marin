"use client";

import Link from "next/link";
import { ArrowRight, PackageOpen } from "lucide-react";
import { Button } from "@de-tin-marin/ui/button";
import {
  orderStatusBadgeClass,
  paymentStatusBadgeClass,
  statusBadgeClassName,
} from "../order-status-badge/order-status-badge.helpers";
import type { OrderListProps } from "./order-list.types";

function formatPrice(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return <span className={statusBadgeClassName(className)}>{label}</span>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-outline-variant/30 bg-surface-container-lowest rounded-4xl flex flex-col items-center justify-center gap-4 border px-8 py-16 text-center">
      <div className="bg-surface-container text-on-surface-variant/60 flex h-16 w-16 items-center justify-center rounded-full">
        <PackageOpen className="h-8 w-8" />
      </div>
      <p className="font-body text-body-md text-on-surface-variant max-w-sm">
        {message}
      </p>
    </div>
  );
}

export function OrderList({ orders, labels }: OrderListProps) {
  if (orders.length === 0) {
    return <EmptyState message={labels.empty} />;
  }

  return (
    <>
      {/* Desktop */}
      <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl hidden overflow-hidden border shadow-xl md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low border-outline-variant/20 border-b">
              {[
                labels.columns.orderNumber,
                labels.columns.customer,
                labels.columns.status,
                labels.columns.payment,
                labels.columns.total,
                labels.columns.lines,
                labels.columns.date,
              ].map((column) => (
                <th
                  key={column}
                  className="font-label text-label-bold text-on-surface-variant px-6 py-5"
                >
                  {column}
                </th>
              ))}
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5 text-right">
                {labels.columns.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-outline-variant/10 divide-y">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-surface-bright group transition-colors"
              >
                <td className="text-on-surface px-6 py-5 font-mono text-sm font-medium">
                  {order.orderNumber}
                </td>
                <td className="text-on-surface px-6 py-5">
                  <p className="font-display text-base font-bold">
                    {order.customerName}
                  </p>
                </td>
                <td className="px-6 py-5">
                  <StatusBadge
                    label={labels.statusLabels[order.status] ?? order.status}
                    className={orderStatusBadgeClass(order.status)}
                  />
                </td>
                <td className="px-6 py-5">
                  <StatusBadge
                    label={
                      labels.paymentStatusLabels[order.paymentStatus] ??
                      order.paymentStatus
                    }
                    className={paymentStatusBadgeClass(order.paymentStatus)}
                  />
                </td>
                <td className="text-on-surface px-6 py-5 font-semibold">
                  {formatPrice(order.total)}
                </td>
                <td className="text-on-surface-variant px-6 py-5 text-sm">
                  {labels.formatLines(order.lineCount)}
                </td>
                <td className="text-on-surface-variant px-6 py-5 text-sm">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-5 text-right">
                  <Link href={`/orders/${order.id}`}>
                    <Button
                      variant="secondary"
                      className="font-label text-label-bold gap-1"
                    >
                      {labels.view}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil */}
      <div className="flex flex-col gap-4 md:hidden">
        {orders.map((order) => (
          <article
            key={order.id}
            className="border-outline-variant/30 bg-surface-container-lowest rounded-3xl border p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-on-surface-variant font-mono text-xs">
                  {order.orderNumber}
                </p>
                <h3 className="font-display text-on-surface mt-1 text-lg font-bold">
                  {order.customerName}
                </h3>
              </div>
              <p className="text-on-surface font-semibold">
                {formatPrice(order.total)}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge
                label={labels.statusLabels[order.status] ?? order.status}
                className={orderStatusBadgeClass(order.status)}
              />
              <StatusBadge
                label={
                  labels.paymentStatusLabels[order.paymentStatus] ??
                  order.paymentStatus
                }
                className={paymentStatusBadgeClass(order.paymentStatus)}
              />
            </div>
            <div className="text-on-surface-variant mt-3 flex items-center justify-between text-sm">
              <span>{labels.formatLines(order.lineCount)}</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <Link href={`/orders/${order.id}`} className="mt-4 block">
              <Button className="w-full gap-2">
                {labels.view}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
