import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { storefrontTabHref } from "@/modules/home/helpers/storefront-url";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import { StorefrontFunnelSteps } from "@/shared/components/storefront-funnel-steps/storefront-funnel-steps";
import { StockBannerSection } from "@/shared/components/stock-banner/stock-banner";
import type { ProductPurchaseBounds } from "@de-tin-marin/shared/product-purchase-limits";
import { getBundleLineChargeableTotal } from "@de-tin-marin/shared/order-cart";
import type { CartPageProps } from "./cart-page.types";

function CartAtmosphere() {
  return (
    <>
      <div
        className="bg-primary-fixed pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full opacity-40 blur-3xl"
        aria-hidden
      />
      <div
        className="bg-secondary-fixed pointer-events-none absolute -bottom-8 -left-16 h-48 w-48 rounded-full opacity-25 blur-3xl"
        aria-hidden
      />
      <div
        className="bg-tertiary-fixed pointer-events-none absolute right-1/3 top-1/2 hidden h-40 w-40 rounded-full opacity-20 blur-3xl md:block"
        aria-hidden
      />
    </>
  );
}

function CartQuantitySelector({
  quantity,
  minQuantity,
  maxQuantity,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="border-outline-variant/40 bg-surface-container-low flex items-center rounded-full border px-1">
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= minQuantity}
        aria-label={decreaseLabel}
        className="text-primary hover:bg-primary-fixed/60 focus-visible:ring-primary disabled:text-on-surface-variant/40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed"
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
        disabled={quantity >= maxQuantity}
        aria-label={increaseLabel}
        className="text-primary hover:bg-primary-fixed/60 focus-visible:ring-primary disabled:text-on-surface-variant/40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function CartSummaryPanel({
  subtotal,
  itemCountLabel,
  labels,
  checkoutHref = "/checkout",
  compact = false,
}: {
  subtotal: number;
  itemCountLabel: string;
  labels: CartPageProps["labels"];
  checkoutHref?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-body text-body-sm text-on-surface-variant">
            {labels.subtotal}
          </p>
          <p className="font-body text-body-xs text-on-surface-variant">
            {itemCountLabel}
          </p>
        </div>
        <p className="font-display text-price-display text-primary text-[28px] leading-none">
          {formatPrice(subtotal)}
        </p>
      </div>
    );
  }

  return (
    <div className="border-outline-variant/30 soft-glow-pink bg-surface-container-lowest overflow-hidden rounded-[28px] border shadow-sm">
      <div className="from-primary via-secondary to-tertiary bg-linear-to-r h-1.5" />
      <div className="space-y-5 p-6">
        <div>
          <p className="font-label text-label-bold text-on-surface">
            {labels.summaryTitle}
          </p>
          <p className="font-body text-body-sm text-on-surface-variant mt-1">
            {itemCountLabel}
          </p>
        </div>
        <div className="border-outline-variant/25 flex items-end justify-between gap-3 border-t pt-4">
          <span className="font-body text-body-md text-on-surface-variant">
            {labels.subtotal}
          </span>
          <span className="font-display text-price-display text-primary">
            {formatPrice(subtotal)}
          </span>
        </div>
        <Link
          href={checkoutHref}
          className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container focus-visible:ring-primary flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 transition-[transform,background-color] duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2"
        >
          {labels.checkout}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function CartLineShell({
  children,
  accent = "default",
  index,
}: {
  children: ReactNode;
  accent?: "default" | "pack" | "bundle";
  index: number;
}) {
  const accentClass =
    accent === "bundle"
      ? "surprise-card-border soft-glow-pink"
      : accent === "pack"
        ? "border-tertiary/25 soft-glow-pink"
        : "border-outline-variant/35 soft-glow-pink";

  return (
    <li
      className={`bg-surface-container-lowest storefront-rise rounded-3xl border p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 sm:p-5 ${accentClass}`}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      {children}
    </li>
  );
}

function CartProductLine({
  cartLineId,
  name,
  unitPrice,
  quantity,
  lineTotal,
  imageUrl,
  bounds,
  labels,
  index,
  onUpdateQuantity,
  onRemove,
}: {
  cartLineId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string;
  bounds: ProductPurchaseBounds;
  labels: CartPageProps["labels"];
  index: number;
  onUpdateQuantity: (
    cartLineId: string,
    quantity: number,
    bounds: ProductPurchaseBounds,
  ) => void;
  onRemove: (cartLineId: string) => void;
}) {
  return (
    <CartLineShell index={index}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="bg-surface-container relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-sm sm:h-24 sm:w-24">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-label text-label-bold text-on-surface text-base">
            {name}
          </p>
          <p className="font-body text-body-sm text-on-surface-variant">
            {formatPrice(unitPrice)} {labels.unitPriceSuffix}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-4">
          <CartQuantitySelector
            quantity={quantity}
            minQuantity={bounds.minQuantity}
            maxQuantity={bounds.maxQuantity}
            decreaseLabel={labels.decreaseQuantity}
            increaseLabel={labels.increaseQuantity}
            onDecrease={() =>
              onUpdateQuantity(cartLineId, quantity - 1, bounds)
            }
            onIncrease={() =>
              onUpdateQuantity(cartLineId, quantity + 1, bounds)
            }
          />
          <p className="font-display text-primary min-w-24 text-right text-[22px] font-extrabold leading-none">
            {formatPrice(lineTotal)}
          </p>
          <button
            type="button"
            onClick={() => onRemove(cartLineId)}
            aria-label={labels.remove}
            className="text-on-surface-variant hover:bg-error-container hover:text-error focus-visible:ring-error flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </CartLineShell>
  );
}

function CartPackLine({
  cartLineId,
  name,
  unitPrice,
  quantity,
  lineTotal,
  componentCount,
  imageUrl,
  bounds,
  labels,
  index,
  onUpdateQuantity,
  onRemove,
}: {
  cartLineId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  componentCount: number;
  imageUrl: string;
  bounds: ProductPurchaseBounds;
  labels: CartPageProps["labels"];
  index: number;
  onUpdateQuantity: (
    cartLineId: string,
    quantity: number,
    bounds: ProductPurchaseBounds,
  ) => void;
  onRemove: (cartLineId: string) => void;
}) {
  return (
    <CartLineShell accent="pack" index={index}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="bg-surface-container relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-sm sm:h-24 sm:w-24">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <span className="bg-tertiary-container text-on-tertiary-container font-label text-label-bold inline-block rounded-full px-3 py-1 text-xs">
            {labels.packBadge}
          </span>
          <p className="font-label text-label-bold text-on-surface text-base">
            {name}
          </p>
          <p className="font-body text-body-sm text-on-surface-variant">
            {formatPrice(unitPrice)} {labels.unitPriceSuffix}
            {componentCount > 0
              ? ` · ${componentCount} ${labels.packComponents}`
              : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-4">
          <CartQuantitySelector
            quantity={quantity}
            minQuantity={bounds.minQuantity}
            maxQuantity={bounds.maxQuantity}
            decreaseLabel={labels.decreaseQuantity}
            increaseLabel={labels.increaseQuantity}
            onDecrease={() =>
              onUpdateQuantity(cartLineId, quantity - 1, bounds)
            }
            onIncrease={() =>
              onUpdateQuantity(cartLineId, quantity + 1, bounds)
            }
          />
          <p className="font-display text-primary min-w-24 text-right text-[22px] font-extrabold leading-none">
            {formatPrice(lineTotal)}
          </p>
          <button
            type="button"
            onClick={() => onRemove(cartLineId)}
            aria-label={labels.remove}
            className="text-on-surface-variant hover:bg-error-container hover:text-error focus-visible:ring-error flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </CartLineShell>
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
  index,
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
  index: number;
  formatBundlePersons: (count: number) => string;
  onRemove: (cartLineId: string) => void;
}) {
  return (
    <CartLineShell accent="bundle" index={index}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="bg-surface-container-low relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <span className="bg-secondary-container text-on-secondary-container font-label text-label-bold inline-block rounded-full px-3 py-1 text-xs">
            {labels.bundleBadge}
          </span>
          <p className="font-label text-label-bold text-on-surface text-base">
            {name}
          </p>
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
          <p className="font-display text-primary text-[22px] font-extrabold leading-none sm:text-[28px]">
            {formatPrice(lineTotal)}
          </p>
          <button
            type="button"
            onClick={() => onRemove(cartLineId)}
            aria-label={labels.remove}
            className="text-on-surface-variant hover:bg-error-container hover:text-error focus-visible:ring-error flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </CartLineShell>
  );
}

export function CartPage({
  lines,
  subtotal,
  labels,
  lineImageUrlByCartLineId,
  productBoundsByCartLineId,
  isStockPending,
  stockWarning,
  stockMessages,
  formatBundlePersons,
  onUpdateQuantity,
  onRemove,
}: CartPageProps) {
  const hasLines = lines.length > 0;
  const itemCountLabel = labels.itemCount;

  return (
    <StorefrontLayout>
      <section
        className={`pt-stack-md md:pt-stack-lg relative overflow-hidden ${hasLines ? "md:pb-section-lg pb-40" : "pb-stack-lg md:pb-section-lg"}`}
      >
        <CartAtmosphere />

        <div className="container-max px-gutter relative z-10">
          <div className="gap-stack-md flex flex-col lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h1 className="font-display text-display-lg-mobile text-primary md:text-display-lg">
                {labels.title}
              </h1>
              {hasLines ? (
                <p className="font-body text-body-lg text-on-surface-variant mt-2 leading-relaxed">
                  {labels.subtitle}
                </p>
              ) : null}
            </div>
            {hasLines ? (
              <StorefrontFunnelSteps
                active="cart"
                ariaLabel={labels.stepsLabel}
                labels={{
                  cart: labels.stepCart,
                  checkout: labels.stepCheckout,
                  done: labels.stepDone,
                }}
              />
            ) : null}
          </div>

          {!hasLines ? (
            <div className="storefront-rise border-outline-variant/30 bg-surface-container-lowest soft-glow-pink mt-stack-lg mb-stack-md rounded-4xl mx-auto max-w-lg border px-6 py-12 text-center sm:px-10">
              <div className="from-primary-fixed to-secondary-fixed bg-linear-to-br mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full">
                <ShoppingBag
                  className="text-primary h-11 w-11"
                  aria-hidden
                  strokeWidth={1.75}
                />
              </div>
              <p className="font-display text-headline-md text-on-surface mb-2">
                {labels.empty}
              </p>
              <p className="font-body text-body-md text-on-surface-variant mb-8">
                {labels.emptyHint}
              </p>
              <Link
                href={storefrontTabHref("productos")}
                className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container focus-visible:ring-primary inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full px-8 py-3 transition-[transform,background-color] duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2"
              >
                {labels.continueShopping}
              </Link>
            </div>
          ) : (
            <div className="gap-stack-lg mt-stack-md grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
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
                  {lines.map((entry, index) =>
                    entry.line.type === "product" ? (
                      <CartProductLine
                        key={entry.cartLineId}
                        cartLineId={entry.cartLineId}
                        name={entry.line.name}
                        unitPrice={entry.line.packagePrice}
                        quantity={entry.line.packageQuantity}
                        lineTotal={entry.line.lineTotal}
                        imageUrl={
                          lineImageUrlByCartLineId[entry.cartLineId] ??
                          CATALOG_PLACEHOLDER_IMAGE
                        }
                        bounds={
                          productBoundsByCartLineId[entry.cartLineId] ?? {
                            minQuantity: 1,
                            maxQuantity: entry.line.packageQuantity,
                            purchasable: true,
                          }
                        }
                        labels={labels}
                        index={index}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemove={onRemove}
                      />
                    ) : entry.line.type === "pack" ? (
                      <CartPackLine
                        key={entry.cartLineId}
                        cartLineId={entry.cartLineId}
                        name={entry.line.name}
                        unitPrice={entry.line.unitPrice}
                        quantity={entry.line.quantity}
                        lineTotal={entry.line.lineTotal}
                        componentCount={entry.line.components.length}
                        imageUrl={
                          lineImageUrlByCartLineId[entry.cartLineId] ??
                          CATALOG_PLACEHOLDER_IMAGE
                        }
                        bounds={
                          productBoundsByCartLineId[entry.cartLineId] ?? {
                            minQuantity: 1,
                            maxQuantity: entry.line.quantity,
                            purchasable: true,
                          }
                        }
                        labels={labels}
                        index={index}
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
                        lineTotal={getBundleLineChargeableTotal(entry.line)}
                        imageUrl={
                          lineImageUrlByCartLineId[entry.cartLineId] ??
                          CATALOG_PLACEHOLDER_IMAGE
                        }
                        labels={labels}
                        index={index}
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
                  <CartSummaryPanel
                    subtotal={subtotal}
                    itemCountLabel={itemCountLabel}
                    labels={labels}
                  />
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
              <CartSummaryPanel
                subtotal={subtotal}
                itemCountLabel={itemCountLabel}
                labels={labels}
                compact
              />
              <Link
                href="/checkout"
                className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary focus-visible:ring-primary flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 focus-visible:outline-none focus-visible:ring-2"
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
