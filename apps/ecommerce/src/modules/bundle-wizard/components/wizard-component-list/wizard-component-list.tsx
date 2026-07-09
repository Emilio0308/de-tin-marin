import Image from "next/image";
import {
  BUNDLE_CUSTOMIZATION_MAX,
  BUNDLE_CUSTOMIZATION_MIN,
} from "@de-tin-marin/validations/customize-bundle";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import { resolveComponentTotalQuantity } from "./wizard-component-list.helpers";
import type { WizardComponentListProps } from "./wizard-component-list.types";

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
  personCount,
  labelsByProductId,
  imagesByProductId,
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
          const imageUrl =
            imagesByProductId[component.productId] ?? CATALOG_PLACEHOLDER_IMAGE;
          const perPerson = component.quantityPerUnit;
          const total = resolveComponentTotalQuantity(perPerson, personCount);

          return (
            <li
              key={component.productId}
              className="border-outline-variant/30 bg-surface-container-lowest flex items-center gap-3 rounded-2xl border px-3 py-3"
            >
              <div className="bg-surface-container-lowest relative h-14 w-14 shrink-0 overflow-hidden rounded-xl shadow-sm">
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-label text-label-bold text-on-surface truncate">
                  {name}
                </p>
                <p className="font-body text-body-sm text-on-surface-variant">
                  {labels.formatQuantityBreakdown({
                    perPerson,
                    surprises: personCount,
                    total,
                  })}
                </p>
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
