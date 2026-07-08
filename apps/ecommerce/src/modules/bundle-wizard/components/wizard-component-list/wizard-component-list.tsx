import type { CustomizeBundleComponent } from "@de-tin-marin/validations/customize-bundle";
import {
  BUNDLE_CUSTOMIZATION_MAX,
  BUNDLE_CUSTOMIZATION_MIN,
} from "@de-tin-marin/validations/customize-bundle";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";

export type WizardComponentListProps = {
  components: CustomizeBundleComponent[];
  labelsByProductId: Record<string, string>;
  unitPricesByProductId: Record<string, number>;
  labels: {
    title: string;
    remove: string;
    minReached: string;
    count: string;
    progressLabel: string;
    unitPriceSuffix: string;
  };
  canRemove: boolean;
  onRemove: (productId: string) => void;
};

function WizardProgressBar({
  current,
  label,
}: {
  current: number;
  label: string;
}) {
  const fillPercent = Math.min(100, (current / BUNDLE_CUSTOMIZATION_MAX) * 100);
  const minMarkerPercent =
    (BUNDLE_CUSTOMIZATION_MIN / BUNDLE_CUSTOMIZATION_MAX) * 100;

  return (
    <div className="space-y-2">
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={BUNDLE_CUSTOMIZATION_MIN}
        aria-valuemax={BUNDLE_CUSTOMIZATION_MAX}
        aria-label={label}
        className="bg-surface-container relative h-2.5 overflow-hidden rounded-full"
      >
        <div
          className="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${fillPercent}%` }}
        />
        <div
          className="bg-outline absolute bottom-0 top-0 w-0.5"
          style={{ left: `${minMarkerPercent}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

export function WizardComponentList({
  components,
  labelsByProductId,
  unitPricesByProductId,
  labels,
  canRemove,
  onRemove,
}: WizardComponentListProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-label text-label-bold text-on-surface">
          {labels.title}
        </h2>
        <p
          aria-live="polite"
          aria-atomic="true"
          className="font-body text-body-sm text-on-surface-variant shrink-0"
        >
          {labels.count}
        </p>
      </div>

      <WizardProgressBar
        current={components.length}
        label={labels.progressLabel}
      />

      {!canRemove ? (
        <p
          role="status"
          className="font-body text-body-sm text-on-surface-variant bg-surface-container border-outline-variant/30 rounded-2xl border px-4 py-3"
        >
          {labels.minReached}
        </p>
      ) : null}

      <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {components.map((component) => {
          const name = labelsByProductId[component.productId] ?? "—";
          const unitPrice = unitPricesByProductId[component.productId];

          return (
            <li
              key={component.productId}
              className="border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between gap-4 rounded-2xl border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-label text-label-bold text-on-surface truncate">
                  {name}
                </p>
                {typeof unitPrice === "number" ? (
                  <p className="font-body text-body-sm text-on-surface-variant">
                    {formatPrice(unitPrice)} {labels.unitPriceSuffix}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={!canRemove}
                onClick={() => onRemove(component.productId)}
                aria-label={`${labels.remove} ${name}`}
                className="font-label text-label-bold text-primary hover:text-secondary disabled:text-on-surface-variant/50 shrink-0 transition-colors disabled:cursor-not-allowed"
              >
                {labels.remove}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
