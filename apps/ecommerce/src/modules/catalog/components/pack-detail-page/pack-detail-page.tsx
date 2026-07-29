import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { storefrontTabHref } from "@/modules/home/helpers/storefront-url";
import { formatPackComponentQuantity } from "./pack-detail-page.helpers";
import type { PackDetailPageProps } from "./pack-detail-page.types";

function PackQuantitySelector({
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

function PackDetailActions({
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
  labels: PackDetailPageProps["labels"];
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onAddToCart?: () => void;
  className?: string;
}) {
  return (
    <div className={`gap-stack-sm flex flex-col ${className ?? ""}`}>
      {!purchasable ? (
        <p className="font-body text-body-sm text-error">
          {labels.unavailable}
        </p>
      ) : null}
      <div className="gap-stack-sm flex items-center">
        <PackQuantitySelector
          quantity={quantity}
          minQuantity={minQuantity}
          maxQuantity={maxQuantity}
          disabled={!purchasable}
          decreaseLabel={labels.decreaseQuantity}
          increaseLabel={labels.increaseQuantity}
          onDecrease={onDecreaseQuantity}
          onIncrease={onIncreaseQuantity}
        />
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!purchasable}
          className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container disabled:bg-on-surface-variant/20 disabled:text-on-surface-variant/60 flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-8 py-3 transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <ShoppingCart className="h-5 w-5" aria-hidden />
          {labels.addToCart}
        </button>
      </div>
    </div>
  );
}

function PackComponentCard({
  item,
  labels,
}: {
  item: PackDetailPageProps["pack"]["items"][number];
  labels: PackDetailPageProps["labels"];
}) {
  const quantityText = formatPackComponentQuantity(item, {
    packagesOfUnits: ({ packages, units }) =>
      labels.formatComponentPackages(packages, units),
    unitsOnly: ({ count }) => labels.formatComponentUnits(count),
  });

  return (
    <li className="border-outline-variant/40 bg-surface-container-lowest flex flex-col overflow-hidden rounded-2xl border">
      <div className="bg-surface-container-low relative aspect-square w-full">
        <Image
          src={item.imageUrl ?? ""}
          alt={item.productName}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 12rem"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="font-label text-label-bold text-on-surface line-clamp-2">
          {item.productName}
        </p>
        {item.description ? (
          <p className="font-body text-body-sm text-on-surface-variant line-clamp-3">
            {item.description}
          </p>
        ) : null}
        <p className="font-label text-label-bold text-primary mt-auto text-sm">
          {quantityText}
        </p>
      </div>
    </li>
  );
}

export function PackDetailPage({
  pack,
  labels,
  quantity,
  minQuantity,
  maxQuantity,
  purchasable,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onAddToCart,
}: PackDetailPageProps) {
  return (
    <StorefrontLayout>
      <section className="container-max px-gutter pt-stack-md md:pb-section-lg md:pt-stack-lg pb-28">
        <Link
          href={storefrontTabHref("combos")}
          className="font-label text-label-bold text-primary hover:text-secondary inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {labels.back}
        </Link>

        <div className="gap-stack-lg mt-stack-md grid grid-cols-1 items-start lg:grid-cols-2">
          <div className="soft-glow-pink border-surface-container-high bg-surface-container-lowest rounded-[32px] border p-4 md:p-6">
            <div className="bg-surface-container-low relative aspect-square w-full overflow-hidden rounded-[24px]">
              <Image
                src={pack.imageUrl ?? ""}
                alt={pack.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 32rem"
                className="object-cover"
              />
            </div>
          </div>

          <div className="space-y-stack-md">
            <div className="space-y-2">
              <h1 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
                {pack.name}
              </h1>
              <p className="font-display text-price-display text-primary">
                {formatPrice(pack.finalPrice)}
              </p>
            </div>

            <p className="font-body text-body-sm text-on-surface-variant">
              {labels.sku}: {pack.sku}
            </p>

            {pack.description ? (
              <div className="space-y-2">
                <h2 className="font-label text-label-bold text-on-surface">
                  {labels.description}
                </h2>
                <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                  {pack.description}
                </p>
              </div>
            ) : null}

            <PackDetailActions
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

        <div className="mt-stack-lg space-y-4">
          <h2 className="font-display text-headline-md text-on-surface">
            {labels.includes}
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {pack.items.map((item) => (
              <PackComponentCard
                key={item.productId}
                item={item}
                labels={labels}
              />
            ))}
          </ul>
        </div>
      </section>

      <div className="border-outline-variant/20 bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t p-4 backdrop-blur-md md:hidden">
        <PackDetailActions
          quantity={quantity}
          minQuantity={minQuantity}
          maxQuantity={maxQuantity}
          purchasable={purchasable}
          labels={labels}
          onDecreaseQuantity={onDecreaseQuantity}
          onIncreaseQuantity={onIncreaseQuantity}
          onAddToCart={onAddToCart}
        />
      </div>
    </StorefrontLayout>
  );
}
