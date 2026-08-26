import { cn } from "@de-tin-marin/shared/cn";

export type AdminTablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
  summaryLabel: string;
  onPageChange: (page: number) => void;
};

export function AdminTablePagination({
  page,
  pageSize,
  total,
  previousLabel,
  nextLabel,
  pageLabel,
  summaryLabel,
  onPageChange,
}: AdminTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  if (total === 0) return null;

  return (
    <div className="bg-surface-container-low border-outline-variant/10 flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-label text-label-bold text-on-surface-variant text-xs">
        {summaryLabel}
      </p>
      <nav
        aria-label={pageLabel}
        className="gap-stack-sm flex items-center justify-end"
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
    </div>
  );
}
