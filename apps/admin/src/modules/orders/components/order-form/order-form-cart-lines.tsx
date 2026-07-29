"use client";

import { Candy, Gift, Minus, Plus } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { OrderFormLine, ProductOption } from "./order-form.types";
import { resolveOrderFormProductBounds } from "./order-form-product.helpers";

type OrderFormCartLinesProps = {
  lines: OrderFormLine[];
  products: ProductOption[];
  bundlesByName: Map<string, string>;
  labels: {
    surpriseLine: string;
    formatQuantityLabel: (quantity: number) => string;
    formatComponents: (count: number) => string;
    removeLine: string;
    editSurprise: string;
    emptyLines: string;
  };
  onRemoveLine: (index: number) => void;
  onUpdateProductQuantity: (index: number, quantity: number) => void;
  onEditBundleLine: (index: number) => void;
  getLineTotal: (index: number) => number | null;
};

export function OrderFormCartLines({
  lines,
  products,
  bundlesByName,
  labels,
  onRemoveLine,
  onUpdateProductQuantity,
  onEditBundleLine,
  getLineTotal,
}: OrderFormCartLinesProps) {
  if (lines.length === 0) {
    return (
      <p className="font-body text-body-sm text-on-surface-variant">
        {labels.emptyLines}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {lines.map((line, index) => {
        const lineTotal = getLineTotal(index);

        if (line.type === "product") {
          const product = products.find((item) => item.id === line.productId);
          const bounds = product
            ? resolveOrderFormProductBounds(product)
            : null;

          return (
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
                    {product?.name ?? "—"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="border-outline-variant/50 bg-surface-container-lowest text-on-surface flex h-8 w-8 items-center justify-center rounded-full border disabled:opacity-40"
                      disabled={!bounds || line.quantity <= bounds.minQuantity}
                      onClick={() =>
                        onUpdateProductQuantity(index, line.quantity - 1)
                      }
                      aria-label="-"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-label text-label-bold text-on-surface min-w-8 text-center text-sm">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="border-outline-variant/50 bg-surface-container-lowest text-on-surface flex h-8 w-8 items-center justify-center rounded-full border disabled:opacity-40"
                      disabled={!bounds || line.quantity >= bounds.maxQuantity}
                      onClick={() =>
                        onUpdateProductQuantity(index, line.quantity + 1)
                      }
                      aria-label="+"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                {lineTotal !== null ? (
                  <p className="font-display text-primary text-lg font-extrabold">
                    S/ {lineTotal.toFixed(2)}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="text-secondary font-label text-label-bold mt-2 text-sm hover:underline"
                  onClick={() => onRemoveLine(index)}
                >
                  {labels.removeLine}
                </button>
              </div>
            </div>
          );
        }

        const bundleName = bundlesByName.get(line.bundleId) ?? "—";

        return (
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
                    {bundleName}
                  </p>
                  <span className="bg-primary text-on-primary rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase">
                    {labels.surpriseLine}
                  </span>
                </div>
                <p className="text-on-surface-variant text-sm">
                  {labels.formatQuantityLabel(line.quantity)} ·{" "}
                  {labels.formatComponents(line.components.length)}
                </p>
                <button
                  type="button"
                  className="text-secondary font-label text-label-bold mt-2 text-sm hover:underline"
                  onClick={() => onEditBundleLine(index)}
                >
                  {labels.editSurprise}
                </button>
              </div>
            </div>
            <div className="relative z-10 shrink-0 text-right">
              {lineTotal !== null ? (
                <p className="font-display text-primary text-lg font-extrabold">
                  S/ {lineTotal.toFixed(2)}
                </p>
              ) : null}
              <button
                type="button"
                className={cn(
                  "text-secondary font-label text-label-bold text-sm hover:underline",
                  lineTotal !== null && "mt-2",
                )}
                onClick={() => onRemoveLine(index)}
              >
                {labels.removeLine}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
