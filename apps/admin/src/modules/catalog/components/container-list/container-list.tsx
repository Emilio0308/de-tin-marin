"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Box,
  Package,
  Pencil,
  Trash2,
  Warehouse,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { SurpriseContainerListItem } from "@/modules/catalog/types/surprise-container.dto";
import { isLowStock } from "../container-form/container-form.helpers";
import type {
  ContainerListLabels,
  ContainerListProps,
} from "./container-list.types";

function ContainerThumb({
  url,
  name,
  className,
}: {
  url: string | null;
  name: string;
  className: string;
}) {
  if (!url) {
    return (
      <div
        className={cn(
          "bg-primary-container/40 text-on-primary-container/60 flex items-center justify-center",
          className,
        )}
        aria-hidden
      >
        <Box className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div
      className={cn("bg-surface-container relative overflow-hidden", className)}
    >
      <Image
        src={url}
        alt={name}
        fill
        unoptimized
        sizes="80px"
        className="object-cover"
      />
    </div>
  );
}

function StatusBadge({
  active,
  labels,
}: {
  active: boolean;
  labels: ContainerListLabels;
}) {
  return (
    <span
      className={cn(
        "font-label text-label-bold rounded-full px-3 py-1 text-[11px] uppercase",
        active
          ? "bg-secondary-container text-on-secondary-container"
          : "bg-surface-container-highest text-on-surface-variant opacity-70",
      )}
    >
      {active ? labels.statusActive : labels.statusInactive}
    </span>
  );
}

function StockDisplay({
  quantity,
  labels,
  variant,
}: {
  quantity: number;
  labels: ContainerListLabels;
  variant: "table" | "card";
}) {
  if (quantity <= 0) {
    return (
      <span className="text-error font-label text-label-bold flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        {labels.stockOut}
      </span>
    );
  }

  if (isLowStock(quantity)) {
    return (
      <span className="text-error font-label text-label-bold flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        {variant === "card"
          ? labels.formatStockUnits(quantity)
          : `${quantity} ${labels.stockCritical}`}
      </span>
    );
  }

  return (
    <span className="text-on-surface-variant font-label text-label-bold flex items-center gap-1.5">
      <Package className="h-4 w-4" aria-hidden />
      {labels.formatStockUnits(quantity)}
    </span>
  );
}

function ContainerActions({
  container,
  onDelete,
  deleting,
  labels,
  variant,
}: {
  container: SurpriseContainerListItem;
  onDelete: (id: string) => void;
  deleting: boolean;
  labels: ContainerListLabels;
  variant: "table" | "card";
}) {
  if (variant === "card") {
    return (
      <div className="mt-3 flex gap-4">
        <Link
          href={`/containers/${container.id}/edit`}
          aria-label={labels.formatAriaEdit(container.name)}
          className="text-primary font-label text-label-bold flex items-center gap-1 transition-transform active:scale-95"
        >
          <Pencil className="h-[18px] w-[18px]" aria-hidden />
          {labels.edit}
        </Link>
        <button
          type="button"
          aria-label={labels.formatAriaDelete(container.name)}
          disabled={deleting}
          onClick={() => onDelete(container.id)}
          className="text-error font-label text-label-bold flex items-center gap-1 transition-transform active:scale-95 disabled:opacity-60"
        >
          <Trash2 className="h-[18px] w-[18px]" aria-hidden />
          {labels.delete}
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/containers/${container.id}/edit`}
        aria-label={labels.formatAriaEdit(container.name)}
        className="text-on-surface-variant hover:bg-primary-container/10 hover:text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </Link>
      <button
        type="button"
        aria-label={labels.formatAriaDelete(container.name)}
        disabled={deleting}
        onClick={() => onDelete(container.id)}
        className="text-on-surface-variant hover:bg-error-container/10 hover:text-error flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function EmptyState({
  hasContainers,
  labels,
}: {
  hasContainers: boolean;
  labels: ContainerListLabels;
}) {
  return (
    <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl border p-12 text-center">
      <p className="font-body text-body-md text-on-surface-variant">
        {hasContainers ? labels.emptyFiltered : labels.empty}
      </p>
    </div>
  );
}

function StatsBar({
  totalStockUnits,
  lowStockCount,
  labels,
}: {
  totalStockUnits: number;
  lowStockCount: number;
  labels: ContainerListLabels;
}) {
  return (
    <div className="hidden gap-4 lg:grid lg:grid-cols-2">
      <div className="border-outline-variant/10 bg-surface-container-lowest flex items-center gap-4 rounded-2xl border p-5">
        <span className="bg-primary-container text-on-primary-container flex h-12 w-12 items-center justify-center rounded-xl">
          <Warehouse className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="font-label text-on-surface-variant text-xs uppercase tracking-wide">
            {labels.stats.totalUnits}
          </p>
          <p className="font-display text-headline-md text-on-surface font-bold">
            {totalStockUnits.toLocaleString("es-PE")}
          </p>
        </div>
      </div>
      <div className="border-outline-variant/10 bg-surface-container-lowest flex items-center gap-4 rounded-2xl border p-5">
        <span className="bg-error-container text-on-error-container flex h-12 w-12 items-center justify-center rounded-xl">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="font-label text-on-surface-variant text-xs uppercase tracking-wide">
            {labels.stats.lowStock}
          </p>
          <p className="font-display text-headline-md text-on-surface font-bold">
            {labels.stats.formatLowStockValue(lowStockCount)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContainerList({
  containers,
  totalCount,
  totalStockUnits,
  lowStockCount,
  labels,
  onDelete,
  deletingId,
}: ContainerListProps) {
  if (containers.length === 0) {
    return <EmptyState hasContainers={totalCount > 0} labels={labels} />;
  }

  return (
    <>
      <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl hidden overflow-hidden border shadow-xl lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low border-outline-variant/20 border-b">
              {[
                labels.columns.sku,
                labels.columns.image,
                labels.columns.name,
                labels.columns.price,
                labels.columns.stock,
                labels.columns.status,
              ].map((label) => (
                <th
                  key={label}
                  className="font-label text-label-bold text-on-surface-variant px-6 py-5 uppercase"
                >
                  {label}
                </th>
              ))}
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5 text-right uppercase">
                {labels.columns.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-outline-variant/10 divide-y">
            {containers.map((container) => (
              <tr
                key={container.id}
                className={cn(
                  "hover:bg-surface-bright group transition-colors",
                  !container.isActive && "opacity-75",
                )}
              >
                <td className="text-on-surface-variant px-6 py-5 font-mono text-sm">
                  {container.sku}
                </td>
                <td className="px-6 py-5">
                  <ContainerThumb
                    url={container.imageUrl}
                    name={container.name}
                    className="h-12 w-12 rounded-xl transition-transform group-hover:scale-110"
                  />
                </td>
                <td className="px-6 py-5">
                  <p className="font-label text-body-md text-on-surface font-bold">
                    {container.name}
                  </p>
                  {container.description ? (
                    <p className="text-on-surface-variant/60 line-clamp-1 text-xs">
                      {container.description}
                    </p>
                  ) : null}
                </td>
                <td className="text-primary px-6 py-5 font-bold">
                  {labels.formatPrice(container.netPrice)}
                </td>
                <td className="px-6 py-5">
                  <StockDisplay
                    quantity={container.stockQuantity}
                    labels={labels}
                    variant="table"
                  />
                </td>
                <td className="px-6 py-5">
                  <StatusBadge active={container.isActive} labels={labels} />
                </td>
                <td className="px-6 py-5 text-right">
                  <ContainerActions
                    container={container}
                    onDelete={onDelete}
                    deleting={deletingId === container.id}
                    labels={labels}
                    variant="table"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-surface-container-low border-outline-variant/10 border-t px-6 py-4">
          <p className="font-label text-label-bold text-on-surface-variant text-xs">
            {labels.formatPagination(containers.length, totalCount)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:hidden">
        {containers.map((container) => (
          <article
            key={container.id}
            className={cn(
              "border-outline-variant/10 bg-surface-container-lowest soft-glow-pink rounded-xl border p-4",
              !container.isActive && "opacity-75",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-label text-secondary text-[12px] font-bold uppercase tracking-wider">
                {container.sku}
              </span>
              <StatusBadge active={container.isActive} labels={labels} />
            </div>
            <h3 className="font-display text-headline-md text-on-surface mt-2 font-bold leading-tight">
              {container.name}
            </h3>
            <p className="text-primary font-display text-headline-sm mt-1 font-bold">
              {labels.formatPrice(container.netPrice)}
            </p>
            <div className="mt-2">
              <StockDisplay
                quantity={container.stockQuantity}
                labels={labels}
                variant="card"
              />
            </div>
            <ContainerActions
              container={container}
              onDelete={onDelete}
              deleting={deletingId === container.id}
              labels={labels}
              variant="card"
            />
          </article>
        ))}
      </div>

      <StatsBar
        totalStockUnits={totalStockUnits}
        lowStockCount={lowStockCount}
        labels={labels}
      />
    </>
  );
}
