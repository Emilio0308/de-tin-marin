import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { storefrontTabHref } from "@/modules/home/helpers/storefront-url";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import { StockBannerSection } from "@/shared/components/stock-banner/stock-banner";
import type { CartPageProps } from "./cart-page.types";

function CartQuantitySelector({
  quantity,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="border-outline-variant/50 bg-surface-container-lowest flex items-center rounded-full border px-1">
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= 1}
        aria-label={decreaseLabel}
        className="text-primary hover:bg-primary-container disabled:text-on-surface-variant/40 flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed"
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <span
        aria-live="polite"
        aria-atomic="true"
        className="font-label text-label-bold text-on-surface min-w-8 text-center"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={increaseLabel}
        className="text-primary hover:bg-primary-container flex h-10 w-10 items-center justify-center rounded-full transition-colors"
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function CartSummaryPanel({
  subtotal,
  labels,
  checkoutHref = "/checkout",
  compact = false,
}: {
  subtotal: number;
  labels: CartPageProps["labels"];
  checkoutHref?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "space-y-1"
          : "border-outline-variant/30 bg-surface-container-lowest soft-glow-pink space-y-4 rounded-3xl border p-6 shadow-sm"
      }
    >
      <p
        className={
          compact
            ? "font-body text-body-sm text-on-surface-variant"
            : "font-label text-label-bold text-on-surface"
        }
      >
        {labels.subtotal}
      </p>
      <p className="font-display text-price-display text-primary">
        {formatPrice(subtotal)}
      </p>
      {!compact ? (
        <Link
          href={checkoutHref}
          className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 py-3 transition-all duration-300 hover:scale-[1.02]"
        >
          {labels.checkout}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

function CartProductLine({
  cartLineId,
  name,
  unitPrice,
  quantity,
  lineTotal,
  imageUrl,
  labels,
  onUpdateQuantity,
  onRemove,
}: {
  cartLineId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string;
  labels: CartPageProps["labels"];
  onUpdateQuantity: (cartLineId: string, quantity: number) => void;
  onRemove: (cartLineId: string) => void;
}) {
  return (
    <li className="border-outline-variant bg-surface-container-lowest flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center">
      <div className="bg-surface-container relative h-16 w-16 shrink-0 overflow-hidden rounded-xl shadow-sm">
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-label text-label-bold text-on-surface">{name}</p>
        <p className="font-body text-body-sm text-on-surface-variant">
          {formatPrice(unitPrice)} {labels.unitPriceSuffix}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <CartQuantitySelector
          quantity={quantity}
          decreaseLabel={labels.decreaseQuantity}
          increaseLabel={labels.increaseQuantity}
          onDecrease={() => onUpdateQuantity(cartLineId, quantity - 1)}
          onIncrease={() => onUpdateQuantity(cartLineId, quantity + 1)}
        />
        <p className="font-display text-price-display text-primary min-w-20 text-right">
          {formatPrice(lineTotal)}
        </p>
        <button
          type="button"
          onClick={() => onRemove(cartLineId)}
          className="font-label text-label-bold text-primary hover:text-secondary transition-colors"
        >
          {labels.remove}
        </button>
      </div>
    </li>
  );
}

function CartBundleLine({
  cartLineId,
  name,
  personCount,
  componentCount,
  containerName,
  lineTotal,
  imageUrl,
  labels,
  formatBundlePersons,
  onRemove,
}: {
  cartLineId: string;
  name: string;
  personCount: number;
  componentCount: number;
  containerName?: string;
  lineTotal: number;
  imageUrl: string;
  labels: CartPageProps["labels"];
  formatBundlePersons: (count: number) => string;
  onRemove: (cartLineId: string) => void;
}) {
  return (
    <li className="border-outline-variant surprise-card-border soft-glow-pink bg-surface-container-lowest rounded-2xl border p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="bg-surface-container-low relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <span className="bg-secondary-container text-on-secondary-container font-label text-label-bold inline-block rounded-full px-3 py-1 text-xs">
            {labels.bundleBadge}
          </span>
          <p className="font-label text-label-bold text-on-surface">{name}</p>
          <p className="font-body text-body-sm text-on-surface-variant">
            {formatBundlePersons(personCount)} · {componentCount}{" "}
            {labels.components}
          </p>
          {containerName ? (
            <p className="font-body text-body-sm text-on-surface-variant">
              {containerName}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
          <p className="font-display text-price-display text-primary">
            {formatPrice(lineTotal)}
          </p>
          <button
            type="button"
            onClick={() => onRemove(cartLineId)}
            className="font-label text-label-bold text-primary hover:text-secondary transition-colors"
          >
            {labels.remove}
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartPage({
  lines,
  subtotal,
  labels,
  lineImageUrlByCartLineId,
  isStockPending,
  stockWarning,
  stockMessages,
  formatBundlePersons,
  onUpdateQuantity,
  onRemove,
}: CartPageProps) {
  const hasLines = lines.length > 0;

  return (
    <StorefrontLayout>
      <section
        className={`bg-tertiary/5 pt-stack-md md:pt-stack-lg ${hasLines ? "md:pb-section-lg pb-40" : "pb-section-lg"}`}
      >
        <div className="container-max px-gutter">
          <h1 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
            {labels.title}
          </h1>

          {!hasLines ? (
            <div className="mt-stack-lg py-stack-lg text-center">
              <div className="bg-surface-container-low mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
                <ShoppingBag
                  className="text-on-surface-variant h-10 w-10"
                  aria-hidden
                />
              </div>
              <p className="font-body text-body-lg text-on-surface-variant mb-6">
                {labels.empty}
              </p>
              <Link
                href={storefrontTabHref("productos")}
                className="press-down bg-primary font-label text-label-bold text-on-primary inline-flex min-h-12 items-center justify-center rounded-full px-8 py-3"
              >
                {labels.continueShopping}
              </Link>
            </div>
          ) : (
            <div className="gap-stack-lg mt-stack-md grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <div className="space-y-stack-md">
                <StockBannerSection
                  isStockPending={isStockPending}
                  stockWarning={stockWarning}
                  title={labels.stockTitle}
                  checkingLabel={labels.stockChecking}
                  messages={stockMessages}
                  className="lg:hidden"
                />

                <ul className="space-y-4">
                  {lines.map((entry) =>
                    entry.line.type === "product" ? (
                      <CartProductLine
                        key={entry.cartLineId}
                        cartLineId={entry.cartLineId}
                        name={entry.line.name}
                        unitPrice={entry.line.unitPrice}
                        quantity={entry.line.quantity}
                        lineTotal={entry.line.lineTotal}
                        imageUrl={
                          lineImageUrlByCartLineId[entry.cartLineId] ??
                          CATALOG_PLACEHOLDER_IMAGE
                        }
                        labels={labels}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemove={onRemove}
                      />
                    ) : (
                      <CartBundleLine
                        key={entry.cartLineId}
                        cartLineId={entry.cartLineId}
                        name={entry.line.name}
                        personCount={entry.line.quantity}
                        componentCount={entry.line.components.length}
                        containerName={entry.line.container?.name}
                        lineTotal={entry.line.lineTotal}
                        imageUrl={
                          lineImageUrlByCartLineId[entry.cartLineId] ??
                          CATALOG_PLACEHOLDER_IMAGE
                        }
                        labels={labels}
                        formatBundlePersons={formatBundlePersons}
                        onRemove={onRemove}
                      />
                    ),
                  )}
                </ul>
              </div>

              <aside className="hidden lg:block">
                <div className="sticky top-28 space-y-4">
                  <StockBannerSection
                    isStockPending={isStockPending}
                    stockWarning={stockWarning}
                    title={labels.stockTitle}
                    checkingLabel={labels.stockChecking}
                    messages={stockMessages}
                  />
                  <CartSummaryPanel subtotal={subtotal} labels={labels} />
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      {hasLines ? (
        <footer className="border-outline-variant/20 bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md lg:hidden">
          <div className="container-max px-gutter mx-auto py-3">
            <div className="flex flex-col gap-3">
              <CartSummaryPanel subtotal={subtotal} labels={labels} compact />
              <Link
                href="/checkout"
                className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 py-3"
              >
                {labels.checkout}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
          </div>
        </footer>
      ) : null}
    </StorefrontLayout>
  );
}
