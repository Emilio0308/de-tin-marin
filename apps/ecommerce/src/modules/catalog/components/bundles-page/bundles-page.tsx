import type { PublicBundleListItem } from "@de-tin-marin/validations/public-catalog";
import type { PublicCatalogSort } from "@de-tin-marin/validations/public-catalog";
import { BundleCard } from "@/modules/home/components/bundle-card/bundle-card";
import { mapBundleToCard } from "@/modules/catalog/helpers/map-catalog-cards";
import { CatalogPagination } from "../catalog-pagination/catalog-pagination";
import { CatalogToolbar } from "../catalog-toolbar/catalog-toolbar";

export type BundlesPageProps = {
  title: string;
  subtitle: string;
  bundles: PublicBundleListItem[];
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
    personalize: string;
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
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSortChange: (sort: PublicCatalogSort) => void;
  onPageChange: (page: number) => void;
};

export function BundlesPage({
  title,
  subtitle,
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
}: BundlesPageProps) {
  return (
    <section className="bg-tertiary/5 py-20">
      <div className="container-max px-gutter">
        <div className="mb-stack-lg text-center">
          <h1 className="font-display text-display-lg-mobile text-on-tertiary-fixed-variant md:text-[36px]">
            {title}
          </h1>
          <p className="font-body text-body-lg text-tertiary mx-auto max-w-xl">
            {subtitle}
          </p>
        </div>

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

        {!isLoading && !isError && bundles.length === 0 ? (
          <p className="font-body text-body-md text-on-surface-variant py-12 text-center">
            {labels.empty}
          </p>
        ) : null}

        {!isLoading && !isError && bundles.length > 0 ? (
          <>
            <div className="gap-stack-lg grid grid-cols-1 md:grid-cols-2">
              {bundles.map((bundle) => (
                <BundleCard
                  key={bundle.id}
                  bundle={mapBundleToCard(bundle)}
                  detailHref={`/sorpresas/${bundle.id}`}
                  personalizeLabel={labels.personalize}
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
