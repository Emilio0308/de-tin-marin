import type { PublicProductListItem } from "@de-tin-marin/validations/public-catalog";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";

export type WizardProductPickerProps = {
  searchValue: string;
  products: PublicProductListItem[];
  selectedProductIds: Set<string>;
  labels: {
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
  canAdd: boolean;
  isLoading: boolean;
  isError: boolean;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onRetry: () => void;
  onAdd: (product: PublicProductListItem) => void;
};

export function WizardProductPicker({
  searchValue,
  products,
  selectedProductIds,
  labels,
  canAdd,
  isLoading,
  isError,
  onSearchChange,
  onSearchSubmit,
  onRetry,
  onAdd,
}: WizardProductPickerProps) {
  return (
    <section className="space-y-4">
      <h2 className="font-label text-label-bold text-on-surface">
        {labels.title}
      </h2>

      {!canAdd ? (
        <p className="font-body text-body-sm text-on-surface-variant bg-surface-container rounded-2xl px-4 py-3">
          {labels.maxReached}
        </p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSearchSubmit();
        }}
      >
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchAriaLabel}
          className="font-body text-body-md text-on-surface border-outline-variant w-full rounded-full border px-4 py-3"
        />
      </form>

      {isLoading ? (
        <p className="font-body text-body-md text-on-surface-variant py-6 text-center">
          {labels.loading}
        </p>
      ) : null}

      {isError ? (
        <div className="py-6 text-center">
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
        <p className="font-body text-body-md text-on-surface-variant py-6 text-center">
          {labels.empty}
        </p>
      ) : null}

      {!isLoading && !isError && products.length > 0 ? (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {products.map((product) => {
            const isSelected = selectedProductIds.has(product.id);
            const disabled = !canAdd || isSelected;

            return (
              <li
                key={product.id}
                className="border-outline-variant flex items-center justify-between gap-4 rounded-2xl border px-4 py-3"
              >
                <div>
                  <p className="font-label text-label-bold text-on-surface">
                    {product.name}
                  </p>
                  <p className="font-body text-body-sm text-on-surface-variant">
                    {formatPrice(product.finalPrice)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onAdd(product)}
                  className="press-down bg-primary font-label text-label-bold text-on-primary disabled:bg-surface-container disabled:text-on-surface-variant rounded-full px-4 py-2"
                >
                  {isSelected ? labels.alreadyAdded : labels.add}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
