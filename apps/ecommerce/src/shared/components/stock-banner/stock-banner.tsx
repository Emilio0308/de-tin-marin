import { AlertTriangle } from "lucide-react";
import type { OrderStockCheckResult } from "@de-tin-marin/shared/check-order-stock";

export function formatStockShortageMessages(
  stockCheck: OrderStockCheckResult | null | undefined,
  labels: { product: string; container: string },
): string[] {
  if (!stockCheck || stockCheck.ok) return [];

  return stockCheck.shortages.map(
    (shortage) =>
      `${shortage.kind === "product" ? labels.product : labels.container} ${shortage.name ?? shortage.sku}: ${shortage.available}/${shortage.required}`,
  );
}

export function StockBannerSkeleton({
  checkingLabel,
}: {
  checkingLabel: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={checkingLabel}
      className="border-outline-variant bg-error-container/60 flex h-28 gap-3 rounded-2xl border px-4 py-3"
    >
      <div className="bg-on-error-container/20 mt-0.5 h-5 w-5 shrink-0 animate-pulse rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="bg-on-error-container/20 h-4 w-32 animate-pulse rounded" />
        <div className="space-y-2">
          <div className="bg-on-error-container/15 h-3 w-full animate-pulse rounded" />
          <div className="bg-on-error-container/15 h-3 w-[80%] animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}

export function StockBanner({
  title,
  messages,
}: {
  title: string;
  messages: string[];
}) {
  return (
    <div
      role="status"
      className="border-outline-variant bg-error-container flex h-28 gap-3 overflow-hidden rounded-2xl border px-4 py-3"
    >
      <AlertTriangle
        className="text-on-error-container mt-0.5 h-5 w-5 shrink-0"
        aria-hidden
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <p className="font-label text-label-bold text-on-error-container mb-2 shrink-0">
          {title}
        </p>
        <ul className="font-body text-body-sm text-on-error-container min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export type StockBannerSectionProps = {
  isStockPending: boolean;
  stockWarning: boolean;
  title: string;
  checkingLabel: string;
  messages: string[];
  className?: string;
};

export function StockBannerSection({
  isStockPending,
  stockWarning,
  title,
  checkingLabel,
  messages,
  className,
}: StockBannerSectionProps) {
  const shouldRender = isStockPending || stockWarning;
  if (!shouldRender) return null;

  return (
    <div className={className}>
      {isStockPending ? (
        <StockBannerSkeleton checkingLabel={checkingLabel} />
      ) : (
        <StockBanner title={title} messages={messages} />
      )}
    </div>
  );
}
