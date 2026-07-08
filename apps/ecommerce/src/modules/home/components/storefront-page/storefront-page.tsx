"use client";

import { cn } from "@de-tin-marin/shared/cn";
import { CategoryFilter } from "@/modules/catalog/components/category-filter/category-filter";
import { CatalogPagination } from "@/modules/catalog/components/catalog-pagination/catalog-pagination";
import { CatalogToolbar } from "@/modules/catalog/components/catalog-toolbar/catalog-toolbar";
import {
  mapBundleToCard,
  mapProductToCard,
} from "@/modules/catalog/helpers/map-catalog-cards";
import { isProductPurchasable } from "@/modules/catalog/helpers/product-purchase-limits";
import { BundleCard } from "@/modules/home/components/bundle-card/bundle-card";
import { HeroSectionContainer } from "@/modules/home/components/hero-section/hero-section.container";
import { ProductCard } from "@/modules/home/components/product-card/product-card";
import type { StorefrontTab } from "@/modules/home/helpers/storefront-url";
import type {
  StorefrontBundlesTabProps,
  StorefrontPageProps,
  StorefrontProductsTabProps,
  StorefrontToolbarLabels,
} from "./storefront-page.types";

function StorefrontTabs({
  tab,
  tabLabels,
  onTabChange,
}: {
  tab: StorefrontTab;
  tabLabels: StorefrontPageProps["tabLabels"];
  onTabChange: (tab: StorefrontTab) => void;
}) {
  const tabs: Array<{ id: StorefrontTab; label: string }> = [
    { id: "productos", label: tabLabels.products },
    { id: "sorpresas", label: tabLabels.bundles },
  ];

  return (
    <div
      role="tablist"
      aria-label={tabLabels.products}
      className="border-outline-variant/20 bg-surface-container-lowest container-max px-gutter mx-auto flex w-full gap-2 rounded-full border p-1 shadow-sm"
    >
      {tabs.map((item) => {
        const selected = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "font-label text-label-bold flex-1 rounded-full px-6 py-3 transition-all duration-200",
              selected
                ? "bg-primary text-on-primary shadow-primary/20 shadow-md"
                : "text-on-surface-variant hover:text-primary",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function CatalogStatus({
  labels,
  isLoading,
  isError,
  isEmpty,
  onRetry,
}: {
  labels: StorefrontToolbarLabels;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <p className="font-body text-body-md text-on-surface-variant py-12 text-center">
        {labels.loading}
      </p>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="font-body text-body-md text-error mb-4">{labels.error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="bg-primary text-on-primary font-label text-label-bold rounded-full px-6 py-2"
        >
          {labels.retry}
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <p className="font-body text-body-md text-on-surface-variant py-12 text-center">
        {labels.empty}
      </p>
    );
  }

  return null;
}

function StorefrontProductsTab({
  categoriesTitle,
  allCategoriesLabel,
  categories,
  activeCategoryId,
  products,
  page,
  pageSize,
  total,
  searchValue,
  sortValue,
  sortOptions,
  labels,
  isLoading,
  isError,
  onRetry,
  onCategoryChange,
  onSearchChange,
  onSearchSubmit,
  onSortChange,
  onPageChange,
  onAddProduct,
}: StorefrontProductsTabProps) {
  const showGrid = !isLoading && !isError && products.length > 0;

  return (
    <section className="bg-surface py-stack-lg">
      <div className="container-max px-gutter">
        <div className="gap-stack-lg flex flex-col lg:flex-row">
          <CategoryFilter
            title={categoriesTitle}
            allLabel={allCategoriesLabel}
            categories={categories}
            activeCategoryId={activeCategoryId}
            onCategoryChange={onCategoryChange}
          />

          <div className="w-full lg:w-3/4">
            <CatalogToolbar
              searchValue={searchValue}
              searchPlaceholder={labels.searchPlaceholder}
              searchAriaLabel={labels.searchAriaLabel}
              sortLabel={labels.sortLabel}
              sortValue={sortValue}
              sortOptions={sortOptions}
              onSearchChange={onSearchChange}
              onSearchSubmit={onSearchSubmit}
              onSortChange={onSortChange}
            />

            <CatalogStatus
              labels={labels}
              isLoading={isLoading}
              isError={isError}
              isEmpty={!isLoading && !isError && products.length === 0}
              onRetry={onRetry}
            />

            {showGrid ? (
              <>
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                  {products.map((product) => (
                    <div key={product.id} className="space-y-2">
                      <ProductCard
                        product={mapProductToCard(product)}
                        detailHref={`/productos/${product.slug}`}
                        addToCartLabel={labels.addToCart}
                        canAddToCart={isProductPurchasable(product)}
                        onAddToCart={
                          onAddProduct && isProductPurchasable(product)
                            ? () => onAddProduct(product)
                            : undefined
                        }
                      />
                      <p className="font-body text-body-sm text-on-surface-variant text-center">
                        {labels.stockLabel}: {product.stockDisplay}
                      </p>
                    </div>
                  ))}
                </div>
                <CatalogPagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  previousLabel={labels.previous}
                  nextLabel={labels.next}
                  pageLabel={labels.page}
                  onPageChange={onPageChange}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function StorefrontBundlesTab({
  bundles,
  page,
  pageSize,
  total,
  searchValue,
  sortValue,
  sortOptions,
  labels,
  isLoading,
  isError,
  onRetry,
  onSearchChange,
  onSearchSubmit,
  onSortChange,
  onPageChange,
}: StorefrontBundlesTabProps) {
  const showGrid = !isLoading && !isError && bundles.length > 0;

  return (
    <section className="bg-tertiary/5 py-20">
      <div className="container-max px-gutter">
        <CatalogToolbar
          searchValue={searchValue}
          searchPlaceholder={labels.searchPlaceholder}
          searchAriaLabel={labels.searchAriaLabel}
          sortLabel={labels.sortLabel}
          sortValue={sortValue}
          sortOptions={sortOptions}
          onSearchChange={onSearchChange}
          onSearchSubmit={onSearchSubmit}
          onSortChange={onSortChange}
        />

        <CatalogStatus
          labels={labels}
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && !isError && bundles.length === 0}
          onRetry={onRetry}
        />

        {showGrid ? (
          <>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {bundles.map((bundle) => (
                <BundleCard
                  key={bundle.id}
                  bundle={mapBundleToCard(bundle)}
                  detailHref={`/sorpresas/${bundle.id}`}
                  personalizeLabel={labels.personalize}
                  priceLabel={labels.price}
                  variant="listing"
                />
              ))}
            </div>
            <CatalogPagination
              page={page}
              pageSize={pageSize}
              total={total}
              previousLabel={labels.previous}
              nextLabel={labels.next}
              pageLabel={labels.page}
              onPageChange={onPageChange}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

export function StorefrontPage({
  tab,
  tabLabels,
  products,
  bundles,
  onTabChange,
}: StorefrontPageProps) {
  return (
    <>
      <HeroSectionContainer />
      <div className="bg-surface py-stack-md">
        <StorefrontTabs
          tab={tab}
          tabLabels={tabLabels}
          onTabChange={onTabChange}
        />
      </div>
      {tab === "productos" ? (
        <StorefrontProductsTab {...products} />
      ) : (
        <StorefrontBundlesTab {...bundles} />
      )}
    </>
  );
}
