"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import { resolveComponentTotalQuantity } from "./wizard-component-list.helpers";
import type { WizardComponentListProps } from "./wizard-component-list.types";

function WizardProgressBar({
  current,
  minProducts,
  maxProducts,
  label,
}: {
  current: number;
  minProducts: number;
  maxProducts: number;
  label: string;
}) {
  const fillPercent = Math.min(100, (current / maxProducts) * 100);
  const minMarkerPercent = (minProducts / maxProducts) * 100;

  return (
    <div className="space-y-2">
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={minProducts}
        aria-valuemax={maxProducts}
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

function UnitsPerPersonStepper({
  value,
  productName,
  onDecrease,
  onIncrease,
}: {
  value: number;
  productName: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  const t = useTranslations("catalog.wizard.componentList");

  return (
    <div className="border-outline-variant bg-surface flex shrink-0 items-center rounded-full border px-0.5">
      <button
        type="button"
        onClick={onDecrease}
        disabled={value <= 1}
        aria-label={t("decreaseUnits", { name: productName })}
        className="text-primary hover:bg-primary-container disabled:text-on-surface-variant/40 flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed"
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <span
        aria-live="polite"
        aria-atomic="true"
        className="font-label text-label-bold text-on-surface min-w-6 text-center text-sm"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={t("increaseUnits", { name: productName })}
        className="text-primary hover:bg-primary-container flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export function WizardComponentList({
  components,
  personCount,
  minProducts,
  maxProducts,
  labelsByProductId,
  imagesByProductId,
  unitPricesByProductId,
  canRemove,
  enableUnitsPerPerson,
  onRemove,
  onQuantityPerUnitChange,
}: WizardComponentListProps) {
  const t = useTranslations("catalog.wizard.componentList");
  const count = t("count", {
    current: components.length,
    max: maxProducts,
  });
  const progressLabel = t("progressLabel", {
    current: components.length,
    max: maxProducts,
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-label text-label-bold text-on-surface">
          {t("title")}
        </h2>
        <p
          aria-live="polite"
          aria-atomic="true"
          className="font-body text-body-sm text-on-surface-variant shrink-0"
        >
          {count}
        </p>
      </div>

      <WizardProgressBar
        current={components.length}
        minProducts={minProducts}
        maxProducts={maxProducts}
        label={progressLabel}
      />

      {!canRemove ? (
        <p
          role="status"
          className="font-body text-body-sm text-on-surface-variant bg-surface-container border-outline-variant/30 rounded-2xl border px-4 py-3"
        >
          {t("minReached", { min: minProducts })}
        </p>
      ) : null}

      <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {components.map((component) => {
          const name = labelsByProductId[component.productId] ?? "—";
          const imageUrl =
            imagesByProductId[component.productId] ?? CATALOG_PLACEHOLDER_IMAGE;
          const perPerson = component.quantityPerUnit;
          const total = resolveComponentTotalQuantity(perPerson, personCount);
          const unitPrice = unitPricesByProductId[component.productId] ?? 0;
          const linePrice = unitPrice * total;
          const removeLabel = t("remove");

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
                <p className="font-body text-body-xs text-on-surface-variant">
                  {t("quantityBreakdown", {
                    perPerson,
                    surprises: personCount,
                    total,
                    price: linePrice.toFixed(2),
                  })}
                </p>
              </div>
              {enableUnitsPerPerson ? (
                <UnitsPerPersonStepper
                  value={perPerson}
                  productName={name}
                  onDecrease={() =>
                    onQuantityPerUnitChange(component.productId, perPerson - 1)
                  }
                  onIncrease={() =>
                    onQuantityPerUnitChange(component.productId, perPerson + 1)
                  }
                />
              ) : null}
              <button
                type="button"
                disabled={!canRemove}
                onClick={() => onRemove(component.productId)}
                aria-label={`${removeLabel} ${name}`}
                className="font-label text-label-bold text-primary hover:text-secondary disabled:text-on-surface-variant/50 shrink-0 transition-colors disabled:cursor-not-allowed"
              >
                {removeLabel}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
