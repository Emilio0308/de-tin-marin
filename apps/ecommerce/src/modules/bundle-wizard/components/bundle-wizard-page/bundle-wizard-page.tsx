import Image from "next/image";
import Link from "next/link";
import type { BundleWizardTemplate } from "@de-tin-marin/validations/customize-bundle";
import type { CustomizeBundleComponent } from "@de-tin-marin/validations/customize-bundle";
import type { OrderStockCheckResult } from "@de-tin-marin/shared/check-order-stock";
import type { PublicProductListItem } from "@de-tin-marin/validations/public-catalog";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { WizardComponentList } from "../wizard-component-list/wizard-component-list";
import { WizardPriceSummary } from "../wizard-price-summary/wizard-price-summary";
import { WizardProductPicker } from "../wizard-product-picker/wizard-product-picker";
import { WizardStockBanner } from "../wizard-stock-banner/wizard-stock-banner";

export type BundleWizardPageProps = {
  template: BundleWizardTemplate;
  components: CustomizeBundleComponent[];
  searchValue: string;
  products: PublicProductListItem[];
  selectedProductIds: Set<string>;
  labelsByProductId: Record<string, string>;
  unitPricesByProductId: Record<string, number>;
  lineTotal: number | null;
  stockCheck: OrderStockCheckResult | null;
  isValid: boolean;
  canRemove: boolean;
  canAdd: boolean;
  isPreviewLoading: boolean;
  isPreviewError: boolean;
  isProductsLoading: boolean;
  isProductsError: boolean;
  isSaved: boolean;
  labels: {
    back: string;
    title: string;
    personCount: string;
    addToCart: string;
    saved: string;
    validationMin: string;
    validationMax: string;
    validationDuplicate: string;
    componentList: {
      title: string;
      remove: string;
      minReached: string;
      count: string;
    };
    picker: {
      title: string;
      searchPlaceholder: string;
      searchAriaLabel: string;
      add: string;
      empty: string;
      maxReached: string;
      alreadyAdded: string;
      loading: string;
      error: string;
      retry: string;
    };
    price: {
      total: string;
      loading: string;
      invalid: string;
    };
    stock: {
      title: string;
      productShortage: string;
      containerShortage: string;
    };
  };
  onRemove: (productId: string) => void;
  onAdd: (product: PublicProductListItem) => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onProductsRetry: () => void;
  onAddToCart: () => void;
};

export function BundleWizardPage({
  template,
  components,
  searchValue,
  products,
  selectedProductIds,
  labelsByProductId,
  unitPricesByProductId,
  lineTotal,
  stockCheck,
  isValid,
  canRemove,
  canAdd,
  isPreviewLoading,
  isProductsLoading,
  isProductsError,
  isSaved,
  labels,
  onRemove,
  onAdd,
  onSearchChange,
  onSearchSubmit,
  onProductsRetry,
  onAddToCart,
}: BundleWizardPageProps) {
  const validationMessage = !isValid
    ? components.length < 5
      ? labels.validationMin
      : components.length > 20
        ? labels.validationMax
        : labels.validationDuplicate
    : null;

  return (
    <StorefrontLayout>
      <section className="container-max px-gutter py-section-lg">
        <Link
          href={`/sorpresas/${template.bundleId}`}
          className="font-label text-label-bold text-primary hover:text-secondary mb-8 inline-block"
        >
          {labels.back}
        </Link>

        <div className="gap-stack-lg mb-stack-lg grid grid-cols-1 items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-4">
            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-[32px]">
              <Image
                src={template.imageUrl ?? ""}
                alt={template.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 20rem"
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="font-display text-display-md-mobile text-on-surface md:text-display-md mb-2">
                {labels.title}
              </h1>
              <p className="font-display text-headline-sm text-on-surface mb-1">
                {template.name}
              </p>
              <span className="bg-primary-container font-label text-label-bold text-on-primary-container inline-block rounded-full px-4 py-1">
                {labels.personCount}
              </span>
            </div>
          </div>

          <div className="space-y-8">
            <WizardComponentList
              components={components}
              labelsByProductId={labelsByProductId}
              unitPricesByProductId={unitPricesByProductId}
              labels={{
                ...labels.componentList,
                count: labels.componentList.count,
              }}
              canRemove={canRemove}
              onRemove={onRemove}
            />

            <WizardProductPicker
              searchValue={searchValue}
              products={products}
              selectedProductIds={selectedProductIds}
              labels={labels.picker}
              canAdd={canAdd}
              isLoading={isProductsLoading}
              isError={isProductsError}
              onSearchChange={onSearchChange}
              onSearchSubmit={onSearchSubmit}
              onRetry={onProductsRetry}
              onAdd={onAdd}
            />
          </div>
        </div>

        <div className="gap-stack-md border-outline-variant bg-surface-container-lowest sticky bottom-4 grid rounded-3xl border p-6 shadow-lg lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-4">
            <WizardPriceSummary
              total={lineTotal}
              labels={labels.price}
              isLoading={isPreviewLoading}
              isValid={isValid}
            />
            <WizardStockBanner stockCheck={stockCheck} labels={labels.stock} />
            {validationMessage ? (
              <p className="font-body text-body-sm text-on-surface-variant">
                {validationMessage}
              </p>
            ) : null}
            {isSaved ? (
              <p
                className="font-body text-body-sm text-secondary"
                role="status"
              >
                {labels.saved}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={!isValid || isPreviewLoading || lineTotal === null}
            onClick={onAddToCart}
            className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary w-full rounded-full px-8 py-3 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
          >
            {labels.addToCart}
          </button>
        </div>
      </section>
    </StorefrontLayout>
  );
}
