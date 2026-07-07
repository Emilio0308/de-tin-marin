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
};

export function WizardPriceSummary({
  total,
  labels,
  isLoading,
  isValid,
}: WizardPriceSummaryProps) {
  return (
    <div className="border-outline-variant rounded-2xl border px-6 py-4">
      <p className="font-label text-label-bold text-on-surface mb-1">
        {labels.total}
      </p>
      {isLoading ? (
        <p className="font-body text-body-md text-on-surface-variant">
          {labels.loading}
        </p>
      ) : null}
      {!isLoading && !isValid ? (
        <p className="font-body text-body-md text-on-surface-variant">
          {labels.invalid}
        </p>
      ) : null}
      {!isLoading && isValid && typeof total === "number" ? (
        <p className="font-display text-price-display text-primary">
          {formatPrice(total)}
        </p>
      ) : null}
    </div>
  );
}
