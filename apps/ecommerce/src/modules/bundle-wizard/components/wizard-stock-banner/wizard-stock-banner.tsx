import type { OrderStockCheckResult } from "@de-tin-marin/shared/check-order-stock";
import {
  formatStockShortageMessages,
  StockBannerSection,
} from "@/shared/components/stock-banner/stock-banner";

export type WizardStockBannerProps = {
  stockCheck: OrderStockCheckResult | null;
  isStockPending: boolean;
  labels: {
    title: string;
    checking: string;
    productShortage: string;
    containerShortage: string;
  };
};

export function WizardStockBanner({
  stockCheck,
  isStockPending,
  labels,
}: WizardStockBannerProps) {
  const messages = formatStockShortageMessages(stockCheck, {
    product: labels.productShortage,
    container: labels.containerShortage,
  });

  return (
    <StockBannerSection
      isStockPending={isStockPending}
      stockWarning={Boolean(stockCheck && !stockCheck.ok)}
      title={labels.title}
      checkingLabel={labels.checking}
      messages={messages}
    />
  );
}
