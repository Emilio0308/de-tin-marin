import { cn } from "@de-tin-marin/shared/cn";
import {
  bundlePriceTotalsDiffer,
  formatAdminMoney,
} from "./order-bundle-price-display.helpers";
import type { OrderBundlePriceDisplayProps } from "./order-bundle-price-display.types";

export function OrderBundlePriceDisplay({
  chargeableTotal,
  rawTotal,
  quantity,
  labels,
  variant = "detail",
  className,
}: OrderBundlePriceDisplayProps) {
  const showBreakdown = bundlePriceTotalsDiffer(rawTotal, chargeableTotal);
  const safeQuantity = Math.max(1, quantity);
  const chargeablePerSurprise = chargeableTotal / safeQuantity;
  const theoreticalPerSurprise = rawTotal / safeQuantity;

  const mainPriceClass =
    variant === "detail"
      ? "font-display text-primary text-lg font-extrabold tabular-nums"
      : "font-display text-primary text-xl font-extrabold tabular-nums";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-end gap-0.5 text-right",
        className,
      )}
    >
      <p className={mainPriceClass}>{formatAdminMoney(chargeableTotal)}</p>
      {showBreakdown ? (
        <>
          <p className="text-on-surface-variant/75 max-w-[14rem] text-xs tabular-nums leading-snug sm:max-w-none">
            {labels.formatTheoreticalTotal(formatAdminMoney(rawTotal))}
          </p>
          <p className="text-on-surface-variant/60 text-[11px] tabular-nums leading-snug">
            {labels.formatPerSurprisePrice(
              formatAdminMoney(chargeablePerSurprise),
              formatAdminMoney(theoreticalPerSurprise),
            )}
          </p>
        </>
      ) : null}
    </div>
  );
}
