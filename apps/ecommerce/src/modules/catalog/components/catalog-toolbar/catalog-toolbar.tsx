import { Search } from "lucide-react";
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
    <div className="border-outline-variant/20 bg-surface-container-lowest gap-stack-md mb-stack-md flex flex-col rounded-2xl border p-3 shadow-sm md:flex-row md:items-end md:justify-between">
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
          className="border-outline-variant/30 bg-surface-container font-body text-body-md text-on-surface focus:border-secondary focus-visible:ring-secondary/30 min-h-12 w-full rounded-xl border px-4 py-2 focus:outline-none focus-visible:ring-2 md:max-w-md"
        />
        <button
          type="submit"
          aria-label={searchAriaLabel}
          title={searchAriaLabel}
          className="bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary focus-visible:ring-secondary flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2"
        >
          <Search className="h-5 w-5" aria-hidden />
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
          className="border-outline-variant/30 bg-surface-container font-body text-body-md text-on-surface focus-visible:ring-secondary min-h-12 rounded-xl border px-3 py-2 focus-visible:outline-none focus-visible:ring-2"
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
