"use client";

import Link from "next/link";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import type { StoredCartLine } from "../../repositories/cart.repository";

export type CartPageProps = {
  lines: StoredCartLine[];
  subtotal: number;
  labels: {
    title: string;
    empty: string;
    checkout: string;
    remove: string;
    subtotal: string;
    quantity: string;
    components: string;
    stockTitle: string;
    stockProduct: string;
    stockContainer: string;
  };
  formatBundlePersons: (count: number) => string;
  stockWarning: boolean;
  stockMessages: string[];
  onUpdateQuantity: (cartLineId: string, quantity: number) => void;
  onRemove: (cartLineId: string) => void;
};

export function CartPage({
  lines,
  subtotal,
  labels,
  stockWarning,
  stockMessages,
  formatBundlePersons,
  onUpdateQuantity,
  onRemove,
}: CartPageProps) {
  return (
    <StorefrontLayout>
      <section className="container-max px-gutter py-section-lg">
        <h1 className="font-display text-display-md-mobile text-on-surface md:text-display-md mb-8">
          {labels.title}
        </h1>

        {lines.length === 0 ? (
          <p className="font-body text-body-lg text-on-surface-variant py-12 text-center">
            {labels.empty}
          </p>
        ) : (
          <div className="gap-stack-lg grid lg:grid-cols-[1fr_320px]">
            <ul className="space-y-4">
              {lines.map((entry) => (
                <li
                  key={entry.cartLineId}
                  className="border-outline-variant rounded-2xl border px-4 py-4"
                >
                  {entry.line.type === "product" ? (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-label text-label-bold text-on-surface">
                          {entry.line.name}
                        </p>
                        <p className="font-body text-body-sm text-on-surface-variant">
                          {formatPrice(entry.line.unitPrice)} / ud.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="font-body text-body-sm text-on-surface-variant">
                          {labels.quantity}
                          <input
                            type="number"
                            min={1}
                            value={entry.line.quantity}
                            onChange={(event) =>
                              onUpdateQuantity(
                                entry.cartLineId,
                                Number(event.target.value) || 1,
                              )
                            }
                            className="font-body text-body-md text-on-surface border-outline-variant ml-2 w-16 rounded-lg border px-2 py-1"
                          />
                        </label>
                        <p className="font-display text-price-display text-primary min-w-24 text-right">
                          {formatPrice(entry.line.lineTotal)}
                        </p>
                        <button
                          type="button"
                          onClick={() => onRemove(entry.cartLineId)}
                          className="font-label text-label-bold text-primary"
                        >
                          {labels.remove}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-label text-label-bold text-on-surface">
                          {entry.line.name}
                        </p>
                        <p className="font-body text-body-sm text-on-surface-variant">
                          {formatBundlePersons(entry.line.quantity)} ·{" "}
                          {entry.line.components.length} {labels.components}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-display text-price-display text-primary">
                          {formatPrice(entry.line.lineTotal)}
                        </p>
                        <button
                          type="button"
                          onClick={() => onRemove(entry.cartLineId)}
                          className="font-label text-label-bold text-primary"
                        >
                          {labels.remove}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <aside className="space-y-4">
              {stockWarning ? (
                <div className="bg-error-container rounded-2xl px-4 py-3">
                  <p className="font-label text-label-bold text-on-error-container mb-2">
                    {labels.stockTitle}
                  </p>
                  <ul className="font-body text-body-sm text-on-error-container space-y-1">
                    {stockMessages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="border-outline-variant rounded-2xl border px-6 py-4">
                <p className="font-label text-label-bold text-on-surface mb-2">
                  {labels.subtotal}
                </p>
                <p className="font-display text-price-display text-primary mb-4">
                  {formatPrice(subtotal)}
                </p>
                <Link
                  href="/checkout"
                  className="press-down bg-primary font-label text-label-bold text-on-primary block rounded-full px-6 py-3 text-center"
                >
                  {labels.checkout}
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </StorefrontLayout>
  );
}
