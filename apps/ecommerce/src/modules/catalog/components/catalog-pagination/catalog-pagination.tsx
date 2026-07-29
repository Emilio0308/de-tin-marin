import { cn } from "@de-tin-marin/shared/cn";

export type CatalogPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
  onPageChange: (page: number) => void;
};

export function CatalogPagination({
  page,
  pageSize,
  total,
  previousLabel,
  nextLabel,
  pageLabel,
  onPageChange,
}: CatalogPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  if (total === 0) return null;

  return (
    <nav
      aria-label={pageLabel}
      className="gap-stack-sm flex items-center justify-center pt-8"
    >
      <button
        type="button"
        disabled={!canGoBack}
        onClick={() => onPageChange(page - 1)}
        className={cn(
          "font-label text-label-bold border-outline-variant rounded-full border px-4 py-2 transition-colors",
          canGoBack
            ? "text-primary hover:bg-primary-container/20"
            : "text-on-surface-variant/40 cursor-not-allowed",
        )}
      >
        {previousLabel}
      </button>
      <span className="font-body text-body-md text-on-surface-variant px-2">
        {pageLabel}
      </span>
      <button
        type="button"
        disabled={!canGoForward}
        onClick={() => onPageChange(page + 1)}
        className={cn(
          "font-label text-label-bold border-outline-variant rounded-full border px-4 py-2 transition-colors",
          canGoForward
            ? "text-primary hover:bg-primary-container/20"
            : "text-on-surface-variant/40 cursor-not-allowed",
        )}
      >
        {nextLabel}
      </button>
    </nav>
  );
}
