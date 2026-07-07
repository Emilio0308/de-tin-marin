import type { OrderStockCheckResult } from "@de-tin-marin/shared/check-order-stock";

export type WizardStockBannerProps = {
  stockCheck: OrderStockCheckResult | null;
  labels: {
    title: string;
    productShortage: string;
    containerShortage: string;
  };
};

export function WizardStockBanner({
  stockCheck,
  labels,
}: WizardStockBannerProps) {
  if (!stockCheck || stockCheck.ok) return null;

  return (
    <div
      role="status"
      className="border-outline-variant bg-error-container rounded-2xl border px-4 py-3"
    >
      <p className="font-label text-label-bold text-on-error-container mb-2">
        {labels.title}
      </p>
      <ul className="font-body text-body-sm text-on-error-container space-y-1">
        {stockCheck.shortages.map((shortage) => (
          <li key={`${shortage.kind}-${shortage.id}`}>
            {shortage.kind === "product"
              ? labels.productShortage
              : labels.containerShortage}{" "}
            {shortage.name ?? shortage.sku}: {shortage.available}/
            {shortage.required}
          </li>
        ))}
      </ul>
    </div>
  );
}
