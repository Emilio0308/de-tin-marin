import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ChevronRight,
  Gift,
  Heart,
  Leaf,
  Minus,
  PartyPopper,
  Plus,
  ShoppingCart,
  Sparkles,
  Wheat,
  Zap,
} from "lucide-react";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { storefrontTabHref } from "@/modules/home/helpers/storefront-url";
import type {
  ProductDetailPageLabels,
  ProductDetailPageProps,
  ProductDetailSuggestedItem,
} from "./product-detail-page.types";

function ProductQuantitySelector({
  quantity,
  minQuantity,
  maxQuantity,
  disabled,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
  size = "md",
}: {
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  disabled?: boolean;
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
  size?: "md" | "lg";
}) {
  const isLarge = size === "lg";

  return (
    <div
      className={`border-outline-variant bg-surface-container-lowest flex items-center shadow-sm ${
        isLarge
          ? "min-w-30 h-16 w-1/3 rounded-2xl border-2 px-2"
          : "rounded-xl border p-1"
      }`}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || quantity <= minQuantity}
        aria-label={decreaseLabel}
        className={`text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:text-on-surface-variant/40 flex items-center justify-center transition-colors disabled:cursor-not-allowed ${
          isLarge ? "h-10 w-10 rounded-xl" : "h-8 w-8 rounded-lg"
        }`}
      >
        <Minus className={isLarge ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
      </button>
      <span
        aria-live="polite"
        aria-atomic="true"
        className={`text-on-surface min-w-10 grow text-center ${
          isLarge
            ? "font-display text-xl font-extrabold"
            : "font-label text-label-bold"
        }`}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || quantity >= maxQuantity}
        aria-label={increaseLabel}
        className={`text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:text-on-surface-variant/40 flex items-center justify-center transition-colors disabled:cursor-not-allowed ${
          isLarge ? "h-10 w-10 rounded-xl" : "h-8 w-8 rounded-lg"
        }`}
      >
        <Plus className={isLarge ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
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
      className={`press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container disabled:bg-on-surface-variant/20 disabled:text-on-surface-variant/60 flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${className ?? ""}`}
    >
      <ShoppingCart className="h-5 w-5" aria-hidden />
      {label}
    </button>
  );
}

function ProductTypeBadge({ label }: { label: string }) {
  return (
    <span className="border-tertiary-container/30 bg-tertiary-container/15 text-tertiary-container font-label text-label-bold whitespace-nowrap rounded-full border px-4 py-1.5">
      {label}
    </span>
  );
}

function HighlightCard({
  icon: Icon,
  label,
  iconClassName,
}: {
  icon: LucideIcon;
  label: string;
  iconClassName: string;
}) {
  return (
    <div className="bg-surface-container-low border-surface-variant/50 flex flex-col items-center rounded-2xl border p-4 text-center">
      <Icon className={`mb-2 h-8 w-8 ${iconClassName}`} aria-hidden />
      <span className="font-label text-label-bold text-on-surface text-[13px]">
        {label}
      </span>
    </div>
  );
}

function WhyCard({
  icon: Icon,
  label,
  iconClassName,
}: {
  icon: LucideIcon;
  label: string;
  iconClassName: string;
}) {
  return (
    <div className="bg-surface-container-lowest border-surface-container-high flex flex-col items-center rounded-2xl border p-3 text-center shadow-sm">
      <Icon className={`mb-2 h-8 w-8 ${iconClassName}`} aria-hidden />
      <p className="font-label text-label-bold text-on-surface text-[13px]">
        {label}
      </p>
    </div>
  );
}

function AvailabilityCard({
  labels,
  sku,
  purchasable,
}: {
  labels: ProductDetailPageLabels;
  sku: string;
  purchasable: boolean;
}) {
  return (
    <div className="bg-surface-container-low border-surface-variant flex items-center justify-between rounded-2xl border p-5">
      <div className="space-y-1">
        <p className="font-label text-label-bold text-on-surface-variant text-xs uppercase tracking-wider">
          {labels.availability}
        </p>
        <div
          className={`flex items-center gap-2 font-bold ${
            purchasable ? "text-secondary" : "text-error"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              purchasable ? "bg-secondary animate-pulse" : "bg-error"
            }`}
            aria-hidden
          />
          <span>{purchasable ? labels.inStock : labels.outOfStock}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="font-label text-label-bold text-on-surface-variant text-xs uppercase tracking-wider">
          {labels.sku}
        </p>
        <p className="text-on-surface font-medium">{sku}</p>
      </div>
    </div>
  );
}

function RelatedProductCard({ item }: { item: ProductDetailSuggestedItem }) {
  return (
    <Link href={`/productos/${item.slug}`} className="group block">
      <div className="bg-surface-container-low border-surface-variant mb-4 aspect-square overflow-hidden rounded-2xl border transition-shadow group-hover:shadow-md">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={320}
            height={320}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="bg-surface-container h-full w-full" />
        )}
      </div>
      <h3 className="text-on-surface group-hover:text-primary font-bold transition-colors">
        {item.name}
      </h3>
      <p className="text-primary font-bold">{formatPrice(item.finalPrice)}</p>
    </Link>
  );
}

function MobileSuggestionCard({ item }: { item: ProductDetailSuggestedItem }) {
  return (
    <Link href={`/productos/${item.slug}`} className="w-32 flex-none">
      <div className="soft-glow-pink border-surface-container-high mb-2 flex aspect-square items-center justify-center rounded-xl border bg-white p-2">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={120}
            height={120}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="bg-surface-container h-full w-full rounded-lg" />
        )}
      </div>
      <p className="font-label text-label-bold mb-1 truncate text-[12px]">
        {item.name}
      </p>
      <p className="text-primary text-[14px] font-bold">
        {formatPrice(item.finalPrice)}
      </p>
    </Link>
  );
}

export function ProductDetailPage({
  product,
  suggestions,
  labels,
  quantity,
  minQuantity,
  maxQuantity,
  purchasable,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onAddToCart,
}: ProductDetailPageProps) {
  const productsHref = storefrontTabHref("productos");
  const desktopSuggestions = suggestions.slice(0, 4);
  const mobileSuggestions = suggestions.slice(0, 6);

  return (
    <StorefrontLayout>
      <main className="container-max px-gutter pt-stack-md md:pb-section-lg pb-32 md:pt-8">
        <Link
          href={productsHref}
          className="font-label text-label-bold text-primary group mb-8 inline-flex w-fit items-center gap-2 transition-all hover:gap-3"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {labels.back}
        </Link>

        {/*
          Desktop: fila 1 = imagen | info (botones con mt-auto alineados al borde inferior de la imagen).
          Fila 2 = badges solo bajo la imagen.
        */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-8">
          {/* Móvil: título arriba */}
          <div className="mb-0 space-y-2 lg:hidden">
            <div className="flex flex-wrap gap-2">
              <span className="bg-primary-fixed text-on-primary-fixed-variant font-label text-label-bold rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide">
                {product.categoryName}
              </span>
              {product.brand ? (
                <span className="bg-secondary-container text-on-secondary-container font-label text-label-bold rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide">
                  {product.brand}
                </span>
              ) : null}
            </div>
            <h1 className="font-display text-display-lg-mobile text-on-surface leading-tight">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-display text-price-display text-primary">
                {formatPrice(product.finalPrice)}
              </p>
              <span className="font-body text-body-md text-on-surface-variant">
                {labels.productTypeLabel}
              </span>
            </div>
          </div>

          {/* Imagen — misma fila que la info en desktop */}
          <div className="lg:col-span-6 lg:row-start-1">
            <div className="soft-glow-pink border-outline-variant group relative aspect-square w-full overflow-hidden rounded-2xl border bg-white">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 36rem"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="bg-surface-container h-full w-full" />
              )}
            </div>

            {/* Móvil: cantidad + stock */}
            <div className="border-surface-container-high bg-surface-container-low mt-stack-md flex items-center justify-between rounded-xl border p-4 lg:hidden">
              <div className="flex flex-col">
                <span className="font-label text-label-bold text-on-surface-variant mb-1 text-[12px] uppercase tracking-wider">
                  {labels.quantity}
                </span>
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
              </div>
              <div className="text-right">
                <span className="font-label text-label-bold text-on-surface-variant mb-1 block text-[12px] uppercase tracking-wider">
                  {labels.availability}
                </span>
                <span
                  className={`font-label text-label-bold ${
                    purchasable ? "text-secondary" : "text-error"
                  }`}
                >
                  {purchasable ? labels.inStock : labels.outOfStock}
                </span>
              </div>
            </div>
          </div>

          {/* Info — estira a la altura de la imagen; acciones al fondo */}
          <div className="flex flex-col lg:col-span-6 lg:row-start-1 lg:h-full">
            <div className="hidden lg:block">
              <nav
                aria-label={labels.category}
                className="text-on-surface-variant mb-4 flex gap-2 text-sm font-medium"
              >
                <Link href={productsHref} className="hover:text-primary">
                  {labels.dulces}
                </Link>
                <span aria-hidden>/</span>
                <span>{product.categoryName}</span>
              </nav>

              <h1 className="font-display text-on-surface mb-6 text-4xl font-extrabold tracking-tight">
                {product.name}
              </h1>

              <div className="mb-8 flex flex-wrap items-center gap-4">
                <p className="font-display text-price-display text-primary drop-shadow-sm">
                  {formatPrice(product.finalPrice)}
                </p>
                <ProductTypeBadge label={labels.productTypeLabel} />
              </div>
            </div>

            {/* Móvil: por qué te encantará */}
            <section className="mb-stack-lg lg:hidden">
              <h2 className="font-display text-headline-md text-on-surface mb-stack-sm flex items-center gap-2">
                <Heart className="text-primary h-5 w-5" aria-hidden />
                {labels.whyTitle}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <WhyCard
                  icon={Sparkles}
                  label={labels.whyFruit}
                  iconClassName="text-secondary"
                />
                <WhyCard
                  icon={Wheat}
                  label={labels.whyTexture}
                  iconClassName="text-tertiary"
                />
                <WhyCard
                  icon={PartyPopper}
                  label={labels.whyGift}
                  iconClassName="text-primary"
                />
                <WhyCard
                  icon={Leaf}
                  label={labels.whyLove}
                  iconClassName="text-secondary"
                />
              </div>
            </section>

            {product.description ? (
              <div className="border-surface-variant mb-8 space-y-3 border-t pt-8 max-lg:border-t-0 max-lg:pt-0">
                <h2 className="font-display text-headline-md text-on-surface text-xl">
                  {labels.description}
                </h2>
                <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                  {product.description}
                </p>
              </div>
            ) : null}

            <div className="mb-8 hidden lg:block">
              <AvailabilityCard
                labels={labels}
                sku={product.sku}
                purchasable={purchasable}
              />
            </div>

            <div className="mt-auto hidden gap-4 lg:flex">
              <ProductQuantitySelector
                quantity={quantity}
                minQuantity={minQuantity}
                maxQuantity={maxQuantity}
                disabled={!purchasable}
                decreaseLabel={labels.decreaseQuantity}
                increaseLabel={labels.increaseQuantity}
                onDecrease={onDecreaseQuantity}
                onIncrease={onIncreaseQuantity}
                size="lg"
              />
              <AddToCartButton
                label={labels.addToCart}
                onClick={onAddToCart}
                disabled={!purchasable}
                className="h-16 grow rounded-2xl text-lg shadow-[0_8px_25px_rgba(182,0,88,0.2)]"
              />
            </div>

            {/* Móvil: completa tu regalo */}
            {mobileSuggestions.length > 0 ? (
              <section className="mb-stack-lg mt-4 lg:hidden">
                <h2 className="font-display text-headline-md text-on-surface mb-stack-sm flex items-center gap-2">
                  <Gift className="text-secondary h-5 w-5" aria-hidden />
                  {labels.completeGiftTitle}
                </h2>
                <div className="-mx-gutter px-gutter flex gap-4 overflow-x-auto pb-4">
                  {mobileSuggestions.map((item) => (
                    <MobileSuggestionCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Badges bajo la imagen (solo desktop) */}
          <div className="hidden grid-cols-3 gap-4 lg:col-span-6 lg:row-start-2 lg:grid">
            <HighlightCard
              icon={Sparkles}
              label={labels.highlightArtisanal}
              iconClassName="text-primary"
            />
            <HighlightCard
              icon={Leaf}
              label={labels.highlightFresh}
              iconClassName="text-secondary"
            />
            <HighlightCard
              icon={Zap}
              label={labels.highlightShipping}
              iconClassName="text-tertiary"
            />
          </div>
        </div>

        {/* Desktop: también te encantará */}
        {desktopSuggestions.length > 0 ? (
          <section className="border-surface-variant mt-16 hidden border-t pt-12 lg:block">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-display text-on-surface mb-2 text-3xl font-extrabold">
                  {labels.relatedTitle}
                </h2>
                <p className="text-on-surface-variant">
                  {labels.relatedSubtitle}
                </p>
              </div>
              <Link
                href={productsHref}
                className="font-label text-label-bold text-primary mb-2 flex items-center gap-1 hover:underline"
              >
                {labels.viewAll}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {desktopSuggestions.map((item) => (
                <RelatedProductCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <div className="border-surface-container-high bg-surface-bright/95 fixed inset-x-0 bottom-0 z-40 border-t p-4 backdrop-blur-lg lg:hidden">
        <AddToCartButton
          label={labels.addToCart}
          onClick={onAddToCart}
          disabled={!purchasable}
          className="shadow-primary/20 h-14 w-full rounded-xl text-base shadow-lg"
        />
      </div>
    </StorefrontLayout>
  );
}
