import type { CustomizeBundleComponent } from "@de-tin-marin/validations/customize-bundle";
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
  };
  canRemove: boolean;
  onRemove: (productId: string) => void;
};

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
        <p className="font-body text-body-sm text-on-surface-variant">
          {labels.count}
        </p>
      </div>

      {!canRemove ? (
        <p className="font-body text-body-sm text-on-surface-variant bg-surface-container rounded-2xl px-4 py-3">
          {labels.minReached}
        </p>
      ) : null}

      <ul className="space-y-3">
        {components.map((component) => {
          const name = labelsByProductId[component.productId] ?? "—";
          const unitPrice = unitPricesByProductId[component.productId];

          return (
            <li
              key={component.productId}
              className="border-outline-variant flex items-center justify-between gap-4 rounded-2xl border px-4 py-3"
            >
              <div>
                <p className="font-label text-label-bold text-on-surface">
                  {name}
                </p>
                {typeof unitPrice === "number" ? (
                  <p className="font-body text-body-sm text-on-surface-variant">
                    {formatPrice(unitPrice)} / ud.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={!canRemove}
                onClick={() => onRemove(component.productId)}
                className="font-label text-label-bold text-primary hover:text-secondary disabled:text-on-surface-variant disabled:cursor-not-allowed"
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
