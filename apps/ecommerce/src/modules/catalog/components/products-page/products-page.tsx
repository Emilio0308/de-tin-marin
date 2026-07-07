import type {
  PublicCategoryItem,
  PublicProductListItem,
} from "@de-tin-marin/validations/public-catalog";
import { ProductCard } from "@/modules/home/components/product-card/product-card";
import { CategoryFilter } from "../category-filter/category-filter";
import { CatalogPagination } from "../catalog-pagination/catalog-pagination";
import { CatalogToolbar } from "../catalog-toolbar/catalog-toolbar";
import { mapProductToCard } from "@/modules/catalog/helpers/map-catalog-cards";
import type { PublicCatalogSort } from "@de-tin-marin/validations/public-catalog";

export type ProductsPageProps = {
  title: string;
  subtitle: string;
  categoriesTitle: string;
  allCategoriesLabel: string;
  categories: PublicCategoryItem[];
  activeCategoryId?: string;
  products: PublicProductListItem[];
  page: number;
  pageSize: number;
  total: number;
  searchValue: string;
  sortValue: PublicCatalogSort;
  sortOptions: Array<{ value: PublicCatalogSort; label: string }>;
  labels: {
    searchPlaceholder: string;
    searchAriaLabel: string;
    sortLabel: string;
    addToCart: string;
    stockLabel: string;
    empty: string;
    loading: string;
    error: string;
    retry: string;
    previous: string;
    next: string;
    page: string;
  };
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onCategoryChange: (categoryId?: string) => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSortChange: (sort: PublicCatalogSort) => void;
  onPageChange: (page: number) => void;
};

export function ProductsPage({
  title,
  subtitle,
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
}: ProductsPageProps) {
  return (
    <section className="bg-surface py-stack-lg">
      <div className="container-max px-gutter">
        <div className="mb-stack-md">
          <h1 className="font-display text-headline-md text-on-surface">
            {title}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant">
            {subtitle}
          </p>
        </div>

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

            {isLoading ? (
              <p className="font-body text-body-md text-on-surface-variant py-12 text-center">
                {labels.loading}
              </p>
            ) : null}

            {isError ? (
              <div className="py-12 text-center">
                <p className="font-body text-body-md text-error mb-4">
                  {labels.error}
                </p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="bg-primary text-on-primary font-label text-label-bold rounded-full px-6 py-2"
                >
                  {labels.retry}
                </button>
              </div>
            ) : null}

            {!isLoading && !isError && products.length === 0 ? (
              <p className="font-body text-body-md text-on-surface-variant py-12 text-center">
                {labels.empty}
              </p>
            ) : null}

            {!isLoading && !isError && products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                  {products.map((product) => (
                    <div key={product.id} className="space-y-2">
                      <ProductCard
                        product={mapProductToCard(product)}
                        detailHref={`/productos/${product.slug}`}
                        addToCartLabel={labels.addToCart}
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
