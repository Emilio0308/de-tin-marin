import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { storefrontTabHref } from "@/modules/home/helpers/storefront-url";
import type { ProductDetailPageProps } from "./product-detail-page.types";

function ProductDetailMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="gap-stack-sm border-outline-variant/30 flex items-baseline justify-between border-b py-3 last:border-b-0">
      <dt className="font-label text-label-bold text-on-surface">{label}</dt>
      <dd className="font-body text-body-md text-on-surface-variant text-right">
        {value}
      </dd>
    </div>
  );
}

function ProductQuantitySelector({
  quantity,
  minQuantity,
  maxQuantity,
  disabled,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  disabled?: boolean;
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="border-outline-variant bg-surface-container-lowest flex items-center rounded-full border px-1">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || quantity <= minQuantity}
        aria-label={decreaseLabel}
        className="text-primary hover:bg-primary-container disabled:text-on-surface-variant/40 flex h-11 w-11 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed"
      >
        <Minus className="h-5 w-5" aria-hidden />
      </button>
      <span
        aria-live="polite"
        aria-atomic="true"
        className="font-label text-label-bold text-on-surface min-w-10 text-center"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || quantity >= maxQuantity}
        aria-label={increaseLabel}
        className="text-primary hover:bg-primary-container disabled:text-on-surface-variant/40 flex h-11 w-11 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed"
      >
        <Plus className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}

function AddToCartButton({
  label,
  onClick,
  disabled,
  className,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container disabled:bg-on-surface-variant/20 disabled:text-on-surface-variant/60 flex min-h-12 items-center justify-center gap-2 rounded-full px-8 py-3 transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100 ${className ?? ""}`}
    >
      <ShoppingCart className="h-5 w-5" aria-hidden />
      {label}
    </button>
  );
}

function ProductDetailActions({
  quantity,
  minQuantity,
  maxQuantity,
  purchasable,
  labels,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onAddToCart,
  className,
}: {
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  purchasable: boolean;
  labels: ProductDetailPageProps["labels"];
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onAddToCart?: () => void;
  className?: string;
}) {
  return (
    <div className={`gap-stack-sm flex items-center ${className ?? ""}`}>
      <ProductQuantitySelector
        quantity={quantity}
        minQuantity={minQuantity}
        maxQuantity={maxQuantity}
        disabled={!purchasable}
        decreaseLabel={labels.decreaseQuantity}
        increaseLabel={labels.increaseQuantity}
        onDecrease={onDecreaseQuantity}
        onIncrease={onIncreaseQuantity}
      />
      <AddToCartButton
        label={labels.addToCart}
        onClick={onAddToCart}
        disabled={!purchasable}
      />
    </div>
  );
}

export function ProductDetailPage({
  product,
  labels,
  quantity,
  minQuantity,
  maxQuantity,
  purchasable,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onAddToCart,
}: ProductDetailPageProps) {
  return (
    <StorefrontLayout>
      <section className="container-max px-gutter pt-stack-md md:pb-section-lg md:pt-stack-lg pb-28">
        <Link
          href={storefrontTabHref("productos")}
          className="font-label text-label-bold text-primary hover:text-secondary inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {labels.back}
        </Link>

        <div className="gap-stack-lg mt-stack-md grid grid-cols-1 items-start lg:grid-cols-2">
          <div className="soft-glow-pink border-surface-container-high bg-surface-container-lowest rounded-[32px] border p-4 md:p-6">
            <div className="bg-surface-container-low relative aspect-square w-full overflow-hidden rounded-[24px]">
              <Image
                src={product.imageUrl ?? ""}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 32rem"
                className="object-cover"
              />
            </div>
          </div>

          <div className="space-y-stack-md">
            <div className="gap-stack-sm flex flex-wrap">
              <span className="border-outline-variant text-primary font-label text-label-bold rounded-full border px-4 py-1.5">
                {product.categoryName}
              </span>
              {product.brand ? (
                <span className="bg-secondary-container text-on-secondary-container font-label text-label-bold rounded-full px-4 py-1.5">
                  {product.brand}
                </span>
              ) : null}
              {labels.packageBadge ? (
                <span className="bg-primary-container text-on-primary-container font-label text-label-bold rounded-full px-4 py-1.5">
                  {labels.packageBadge}
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
                {product.name}
              </h1>
              <p className="font-display text-price-display text-primary">
                {formatPrice(product.finalPrice)}
              </p>
            </div>

            <dl className="bg-surface-container-low border-outline-variant/30 rounded-2xl border px-4">
              <ProductDetailMeta label={labels.sku} value={product.sku} />
              <ProductDetailMeta
                label={labels.stock}
                value={product.stockDisplay}
              />
            </dl>

            {product.description ? (
              <div className="space-y-2">
                <h2 className="font-label text-label-bold text-on-surface">
                  {labels.description}
                </h2>
                <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                  {product.description}
                </p>
              </div>
            ) : null}

            <ProductDetailActions
              quantity={quantity}
              minQuantity={minQuantity}
              maxQuantity={maxQuantity}
              purchasable={purchasable}
              labels={labels}
              onDecreaseQuantity={onDecreaseQuantity}
              onIncreaseQuantity={onIncreaseQuantity}
              onAddToCart={onAddToCart}
              className="hidden md:flex"
            />
          </div>
        </div>
      </section>

      <div className="border-outline-variant/20 bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t p-4 backdrop-blur-md md:hidden">
        <ProductDetailActions
          quantity={quantity}
          minQuantity={minQuantity}
          maxQuantity={maxQuantity}
          purchasable={purchasable}
          labels={labels}
          onDecreaseQuantity={onDecreaseQuantity}
          onIncreaseQuantity={onIncreaseQuantity}
          onAddToCart={onAddToCart}
          className="w-full [&>button:last-child]:flex-1"
        />
      </div>
    </StorefrontLayout>
  );
}
