import type { PublicCatalogSort } from "@de-tin-marin/validations/public-catalog";

export type CatalogToolbarProps = {
  searchValue: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  sortLabel: string;
  sortValue: PublicCatalogSort;
  sortOptions: Array<{ value: PublicCatalogSort; label: string }>;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSortChange: (value: PublicCatalogSort) => void;
};

export function CatalogToolbar({
  searchValue,
  searchPlaceholder,
  searchAriaLabel,
  sortLabel,
  sortValue,
  sortOptions,
  onSearchChange,
  onSearchSubmit,
  onSortChange,
}: CatalogToolbarProps) {
  return (
    <div className="gap-stack-md mb-stack-md flex flex-col md:flex-row md:items-end md:justify-between">
      <form
        className="flex flex-1 gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSearchSubmit();
        }}
      >
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel}
          className="border-outline-variant/30 bg-surface-container font-body text-body-md text-on-surface focus:border-secondary w-full rounded-xl border px-4 py-2 focus:outline-none md:max-w-md"
        />
        <button
          type="submit"
          className="bg-secondary-container text-on-secondary-container font-label text-label-bold hover:bg-secondary hover:text-on-secondary rounded-xl px-4 py-2 transition-colors"
        >
          {searchAriaLabel}
        </button>
      </form>

      <label className="flex flex-col gap-1">
        <span className="font-label text-label-bold text-on-surface-variant text-sm">
          {sortLabel}
        </span>
        <select
          value={sortValue}
          onChange={(event) =>
            onSortChange(event.target.value as PublicCatalogSort)
          }
          className="border-outline-variant/30 bg-surface-container font-body text-body-md text-on-surface rounded-xl border px-3 py-2"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
