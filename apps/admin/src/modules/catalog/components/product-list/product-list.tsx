"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Candy, Package, Pencil, Trash2 } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { ProductListItem } from "@de-tin-marin/validations/product";
import type { ProductListLabels, ProductListProps } from "./product-list.types";

const LOW_STOCK_THRESHOLD = 10;

const CATEGORY_BADGE_STYLES = [
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  "bg-primary-fixed text-on-primary-fixed",
  "bg-surface-container-highest text-on-surface-variant",
];

function formatPrice(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

function categoryBadgeClass(name: string): string {
  const sum = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CATEGORY_BADGE_STYLES[sum % CATEGORY_BADGE_STYLES.length] ?? "";
}

type StockTone = "out" | "low" | "ok";

function stockTone(quantity: number): StockTone {
  if (quantity <= 0) return "out";
  if (quantity <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

function ProductThumb({
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
          "bg-surface-container text-on-surface-variant/50 flex items-center justify-center",
          className,
        )}
        aria-hidden
      >
        <Candy className="h-6 w-6" />
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

function StatusToggle({
  active,
  disabled,
  onToggle,
  labels,
}: {
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
  labels: ProductListLabels;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? labels.ariaDeactivate : labels.ariaActivate}
      disabled={disabled}
      onClick={onToggle}
      className="inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={cn(
          "inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors duration-200",
          active ? "bg-secondary" : "bg-surface-container-high",
        )}
      >
        <span
          className={cn(
            "h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
            active ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
      <span className="font-label text-label-bold text-on-surface-variant">
        {active ? labels.statusActive : labels.statusInactive}
      </span>
    </button>
  );
}

function StockCell({
  quantity,
  display,
}: {
  quantity: number;
  display: string;
}) {
  const tone = stockTone(quantity);
  const barWidth = quantity <= 0 ? 0 : Math.min(100, Math.max(8, quantity));

  return (
    <div className="flex flex-col items-center gap-1" title={display}>
      <span
        className={cn(
          "text-sm font-bold",
          tone === "ok" && "text-on-surface",
          tone === "low" && "text-error",
          tone === "out" && "text-on-surface-variant",
        )}
      >
        {quantity}
      </span>
      <span className="bg-surface-container h-1 w-12 overflow-hidden rounded-full">
        <span
          className={cn(
            "block h-full rounded-full",
            tone === "ok" && "bg-secondary",
            tone === "low" && "bg-error",
            tone === "out" && "bg-outline",
          )}
          style={{ width: `${barWidth}%` }}
        />
      </span>
    </div>
  );
}

function StockBadge({
  quantity,
  display,
  labels,
}: {
  quantity: number;
  display: string;
  labels: ProductListLabels;
}) {
  const tone = stockTone(quantity);

  if (tone === "ok") {
    return (
      <span
        className="text-on-surface-variant flex items-center gap-1.5"
        title={display}
      >
        <Package className="h-[18px] w-[18px]" aria-hidden />
        <span className="font-label text-label-bold">
          {labels.formatStockAvailable(quantity)}
        </span>
      </span>
    );
  }

  return (
    <span className="text-error flex items-center gap-1.5">
      <AlertTriangle className="h-[18px] w-[18px]" aria-hidden />
      <span className="font-label text-label-bold">
        {quantity <= 0 ? labels.stockOut : labels.formatStockLow(quantity)}
      </span>
    </span>
  );
}

function ProductActions({
  product,
  onDelete,
  deleting,
  labels,
}: {
  product: ProductListItem;
  onDelete: (id: string) => void;
  deleting: boolean;
  labels: ProductListLabels;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/products/${product.id}/edit`}
        aria-label={labels.formatAriaEdit(product.name)}
        className="text-on-surface-variant hover:bg-surface-container-high hover:text-secondary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </Link>
      <button
        type="button"
        aria-label={labels.formatAriaDelete(product.name)}
        disabled={deleting}
        onClick={() => onDelete(product.id)}
        className="text-on-surface-variant hover:bg-error-container hover:text-error flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function EmptyState({
  hasProducts,
  labels,
}: {
  hasProducts: boolean;
  labels: ProductListLabels;
}) {
  return (
    <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl border p-12 text-center">
      <p className="font-body text-body-md text-on-surface-variant">
        {hasProducts ? labels.emptyFiltered : labels.empty}
      </p>
    </div>
  );
}

export function ProductList({
  products,
  totalCount,
  labels,
  onDelete,
  deletingId,
  onToggleActive,
  togglingId,
}: ProductListProps) {
  if (products.length === 0) {
    return <EmptyState hasProducts={totalCount > 0} labels={labels} />;
  }

  return (
    <>
      {/* Desktop: tabla estilo catálogo */}
      <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl hidden overflow-hidden border shadow-xl lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low border-outline-variant/20 border-b">
              {[
                labels.columns.sku,
                labels.columns.image,
                labels.columns.name,
                labels.columns.category,
                labels.columns.price,
              ].map((label) => (
                <th
                  key={label}
                  className="font-label text-label-bold text-on-surface-variant px-6 py-5"
                >
                  {label}
                </th>
              ))}
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5 text-center">
                {labels.columns.stock}
              </th>
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5">
                {labels.columns.status}
              </th>
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5 text-right">
                {labels.columns.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-outline-variant/10 divide-y">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-surface-bright group transition-colors"
              >
                <td className="text-on-surface-variant px-6 py-5 font-mono text-sm">
                  {product.sku}
                </td>
                <td className="px-6 py-5">
                  <ProductThumb
                    url={product.imageUrl}
                    name={product.name}
                    className="border-outline-variant/20 h-14 w-14 rounded-2xl border transition-transform group-hover:scale-110"
                  />
                </td>
                <td className="px-6 py-5">
                  <p className="font-display text-on-surface text-base font-bold">
                    {product.name}
                  </p>
                  {product.brand ? (
                    <p className="text-on-surface-variant/60 text-xs">
                      {product.brand}
                    </p>
                  ) : null}
                </td>
                <td className="px-6 py-5">
                  <span
                    className={cn(
                      "font-label rounded-full px-3 py-1 text-xs font-bold",
                      categoryBadgeClass(product.categoryName),
                    )}
                  >
                    {product.categoryName}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="font-display text-primary text-lg font-extrabold">
                    {formatPrice(product.finalPrice)}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <StockCell
                    quantity={product.stockTotalBaseUnits}
                    display={product.stockDisplay}
                  />
                </td>
                <td className="px-6 py-5">
                  <StatusToggle
                    active={product.isActive}
                    disabled={togglingId === product.id}
                    onToggle={() => onToggleActive(product)}
                    labels={labels}
                  />
                </td>
                <td className="px-6 py-5 text-right">
                  <ProductActions
                    product={product}
                    onDelete={onDelete}
                    deleting={deletingId === product.id}
                    labels={labels}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-surface-container-low border-outline-variant/10 border-t px-6 py-4">
          <p className="font-label text-label-bold text-on-surface-variant text-xs">
            {labels.formatPagination(products.length, totalCount)}
          </p>
        </div>
      </div>

      {/* Móvil: tarjetas de producto */}
      <div className="flex flex-col gap-4 lg:hidden">
        {products.map((product) => (
          <article
            key={product.id}
            className="border-outline-variant/10 bg-surface-container-lowest flex flex-col gap-3 rounded-2xl border p-4 shadow-sm"
          >
            <div className="flex gap-4">
              <ProductThumb
                url={product.imageUrl}
                name={product.name}
                className="h-20 w-20 shrink-0 rounded-xl"
              />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-label text-on-surface-variant/60 text-[10px] uppercase tracking-widest">
                      {labels.columns.sku}: {product.sku}
                    </span>
                    <span
                      className={cn(
                        "font-label rounded-md px-2 py-0.5 text-[11px] font-bold",
                        categoryBadgeClass(product.categoryName),
                      )}
                    >
                      {product.categoryName}
                    </span>
                  </div>
                  <h3 className="font-display text-body-md text-on-surface mt-1 font-bold leading-tight">
                    {product.name}
                  </h3>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="font-display text-primary text-[20px] font-extrabold">
                    {formatPrice(product.finalPrice)}
                  </span>
                  <StockBadge
                    quantity={product.stockTotalBaseUnits}
                    display={product.stockDisplay}
                    labels={labels}
                  />
                </div>
              </div>
            </div>
            <div className="bg-outline-variant/10 h-px w-full" />
            <div className="flex items-center justify-between">
              <StatusToggle
                active={product.isActive}
                disabled={togglingId === product.id}
                onToggle={() => onToggleActive(product)}
                labels={labels}
              />
              <div className="flex items-center gap-1">
                <Link
                  href={`/products/${product.id}/edit`}
                  aria-label={labels.formatAriaEdit(product.name)}
                  className="text-secondary font-label text-label-bold hover:bg-secondary/5 flex items-center gap-1 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {labels.edit}
                  <Pencil className="h-[18px] w-[18px]" aria-hidden />
                </Link>
                <button
                  type="button"
                  aria-label={labels.formatAriaDelete(product.name)}
                  disabled={deletingId === product.id}
                  onClick={() => onDelete(product.id)}
                  className="text-on-surface-variant hover:bg-error-container hover:text-error flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
