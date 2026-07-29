import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";

export type WizardPriceSummaryProps = {
  total: number | null;
  labels: {
    total: string;
    loading: string;
    invalid: string;
  };
  isLoading: boolean;
  isValid: boolean;
  compact?: boolean;
};

export function WizardPriceSummary({
  total,
  labels,
  isLoading,
  isValid,
  compact = false,
}: WizardPriceSummaryProps) {
  return (
    <div
      className={
        compact
          ? "space-y-0.5"
          : "border-outline-variant/30 bg-surface-container-lowest rounded-2xl border px-6 py-4"
      }
    >
      <p
        className={
          compact
            ? "font-body text-body-sm text-on-surface-variant"
            : "font-label text-label-bold text-on-surface mb-1"
        }
      >
        {labels.total}
      </p>
      {isLoading ? (
        <div role="status" aria-live="polite" className="space-y-2">
          <p className="font-body text-body-md text-on-surface-variant">
            {labels.loading}
          </p>
          {!compact ? (
            <div className="bg-surface-container h-8 w-32 animate-pulse rounded-lg" />
          ) : null}
        </div>
      ) : null}
      {!isLoading && !isValid ? (
        <p
          role="status"
          className="font-body text-body-md text-on-surface-variant"
        >
          {labels.invalid}
        </p>
      ) : null}
      {!isLoading && isValid && typeof total === "number" ? (
        <p
          aria-live="polite"
          className="font-display text-price-display text-primary"
        >
          {formatPrice(total)}
        </p>
      ) : null}
    </div>
  );
}
