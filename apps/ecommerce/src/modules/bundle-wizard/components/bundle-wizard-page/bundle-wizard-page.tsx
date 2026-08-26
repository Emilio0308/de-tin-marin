import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { WizardComponentList } from "../wizard-component-list/wizard-component-list";
import { WizardPriceSummary } from "../wizard-price-summary/wizard-price-summary";
import { WizardProductPicker } from "../wizard-product-picker/wizard-product-picker";
import { WizardStockBanner } from "../wizard-stock-banner/wizard-stock-banner";
import type { BundleWizardPageProps } from "./bundle-wizard-page.types";

function resolveBundleValidationMessage({
  isValid,
  componentCount,
  minProducts,
  maxProducts,
  labels,
}: {
  isValid: boolean;
  componentCount: number;
  minProducts: number;
  maxProducts: number;
  labels: Pick<
    BundleWizardPageProps["labels"],
    "validationMin" | "validationMax" | "validationDuplicate"
  >;
}): { message: string; severity: "error" | "muted" } | null {
  if (isValid) return null;

  if (componentCount < minProducts) {
    return { message: labels.validationMin, severity: "error" };
  }

  if (componentCount > maxProducts) {
    return { message: labels.validationMax, severity: "error" };
  }

  return { message: labels.validationDuplicate, severity: "muted" };
}

function SurpriseQuantitySelector({
  quantity,
  minQuantity,
  maxQuantity,
  labels,
  onQuantityChange,
}: {
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  labels: Pick<
    BundleWizardPageProps["labels"],
    | "surpriseQuantity"
    | "surpriseQuantityHint"
    | "decreaseQuantity"
    | "increaseQuantity"
  >;
  onQuantityChange: (quantity: number) => void;
}) {
  return (
    <div className="border-outline-variant/40 bg-surface-container-lowest space-y-3 rounded-[24px] border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-label text-label-bold text-on-surface text-sm">
            {labels.surpriseQuantity}
          </p>
          <p className="font-body text-body-sm text-on-surface-variant mt-1">
            {labels.surpriseQuantityHint}
          </p>
        </div>
        <div className="border-outline-variant bg-surface flex items-center rounded-full border px-1">
          <button
            type="button"
            onClick={() => onQuantityChange(quantity - 1)}
            disabled={quantity <= minQuantity}
            aria-label={labels.decreaseQuantity}
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
            onClick={() => onQuantityChange(quantity + 1)}
            disabled={quantity >= maxQuantity}
            aria-label={labels.increaseQuantity}
            className="text-primary hover:bg-primary-container disabled:text-on-surface-variant/40 flex h-11 w-11 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

export function BundleWizardPage({
  template,
  components,
  quantity,
  minQuantity,
  maxQuantity,
  searchValue,
  products,
  selectedProductIds,
  labelsByProductId,
  imagesByProductId,
  unitPricesByProductId,
  lineTotal,
  stockCheck,
  isValid,
  canRemove,
  canAdd,
  enableUnitsPerPerson,
  isPreviewLoading,
  isPreviewError,
  isProductsLoading,
  isProductsFetchingNextPage,
  hasMoreProducts,
  isProductsError,
  isAddingToCart,
  labels,
  onRemove,
  onAdd,
  onQuantityPerUnitChange,
  onQuantityChange,
  onSearchChange,
  onSearchSubmit,
  onProductsRetry,
  onLoadMoreProducts,
  onPreviewRetry,
  onAddToCart,
}: BundleWizardPageProps) {
  const minProducts = template.customizationMinProducts;
  const maxProducts = template.customizationMaxProducts;
  const validation = resolveBundleValidationMessage({
    isValid,
    componentCount: components.length,
    minProducts,
    maxProducts,
    labels,
  });

  const isCtaDisabled =
    !isValid ||
    isPreviewLoading ||
    isPreviewError ||
    lineTotal === null ||
    isAddingToCart;

  return (
    <StorefrontLayout>
      <section className="bg-tertiary/5 pt-stack-md md:pt-stack-lg pb-44 md:pb-36">
        <div className="container-max px-gutter">
          <Link
            href={`/sorpresas/${template.bundleId}`}
            className="font-label text-label-bold text-primary hover:text-secondary inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {labels.back}
          </Link>

          <div className="gap-stack-lg mt-stack-md grid grid-cols-1 items-start lg:grid-cols-2">
            <div className="space-y-stack-md">
              <div className="surprise-card-border soft-glow-pink bg-surface-container-lowest rounded-[32px] p-4 md:p-6">
                <div className="bg-surface-container-low relative aspect-square w-full overflow-hidden rounded-[24px]">
                  <Image
                    src={template.imageUrl ?? ""}
                    alt={template.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 32rem"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="space-y-stack-sm">
                <h1 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
                  {labels.title}
                </h1>
                <p className="font-display text-headline-md text-on-surface">
                  {template.name}
                </p>
                <div className="gap-stack-sm flex flex-wrap">
                  <span className="border-outline-variant text-primary font-label text-label-bold rounded-full border px-4 py-1.5">
                    {template.container.name}
                  </span>
                  <span className="bg-secondary-container text-on-secondary-container font-label text-label-bold rounded-full px-4 py-1.5">
                    {labels.personCount}
                  </span>
                </div>
                {template.description ? (
                  <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                    {template.description}
                  </p>
                ) : null}
              </div>

              <SurpriseQuantitySelector
                quantity={quantity}
                minQuantity={minQuantity}
                maxQuantity={maxQuantity}
                labels={labels}
                onQuantityChange={onQuantityChange}
              />
            </div>

            <div className="space-y-stack-md">
              <WizardComponentList
                components={components}
                personCount={quantity}
                minProducts={minProducts}
                maxProducts={maxProducts}
                labelsByProductId={labelsByProductId}
                imagesByProductId={imagesByProductId}
                unitPricesByProductId={unitPricesByProductId}
                canRemove={canRemove}
                enableUnitsPerPerson={enableUnitsPerPerson}
                onRemove={onRemove}
                onQuantityPerUnitChange={onQuantityPerUnitChange}
              />

              <WizardProductPicker
                searchValue={searchValue}
                products={products}
                selectedProductIds={selectedProductIds}
                labels={labels.picker}
                canAdd={canAdd}
                isLoading={isProductsLoading}
                isFetchingNextPage={isProductsFetchingNextPage}
                hasNextPage={hasMoreProducts}
                isError={isProductsError}
                onSearchChange={onSearchChange}
                onSearchSubmit={onSearchSubmit}
                onRetry={onProductsRetry}
                onLoadMore={onLoadMoreProducts}
                onAdd={onAdd}
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-outline-variant/20 bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md">
        <div className="container-max px-gutter mx-auto py-3 md:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="min-w-0 flex-1 space-y-2">
              <WizardPriceSummary
                total={lineTotal}
                labels={labels.price}
                isLoading={isPreviewLoading}
                isValid={isValid}
                compact
              />

              {isPreviewError ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-body text-body-sm text-error">
                    {labels.price.previewError}
                  </p>
                  <button
                    type="button"
                    onClick={onPreviewRetry}
                    className="press-down bg-primary text-on-primary font-label text-label-bold rounded-full px-4 py-1.5"
                  >
                    {labels.price.retry}
                  </button>
                </div>
              ) : null}

              <WizardStockBanner
                stockCheck={stockCheck}
                isStockPending={isPreviewLoading}
                labels={labels.stock}
              />

              {validation ? (
                <p
                  role="alert"
                  className={`font-body text-body-sm ${
                    validation.severity === "error"
                      ? "text-error"
                      : "text-on-surface-variant"
                  }`}
                >
                  {validation.message}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              disabled={isCtaDisabled}
              onClick={onAddToCart}
              aria-disabled={isCtaDisabled}
              className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full px-8 py-3 transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto lg:min-w-[220px]"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden />
              {isAddingToCart ? labels.addToCartLoading : labels.addToCart}
            </button>
          </div>
        </div>
      </footer>
    </StorefrontLayout>
  );
}
