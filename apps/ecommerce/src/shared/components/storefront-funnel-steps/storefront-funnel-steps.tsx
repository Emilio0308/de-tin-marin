import { Check } from "lucide-react";

export type StorefrontFunnelStepId = "cart" | "checkout" | "done";

export type StorefrontFunnelStepsProps = {
  active: Exclude<StorefrontFunnelStepId, "done">;
  ariaLabel: string;
  labels: {
    cart: string;
    checkout: string;
    done: string;
  };
};

const STEP_ORDER: StorefrontFunnelStepId[] = ["cart", "checkout", "done"];

function stepState(
  step: StorefrontFunnelStepId,
  active: StorefrontFunnelStepsProps["active"],
): "complete" | "current" | "upcoming" {
  const stepIndex = STEP_ORDER.indexOf(step);
  const activeIndex = STEP_ORDER.indexOf(active);
  if (stepIndex < activeIndex) return "complete";
  if (stepIndex === activeIndex) return "current";
  return "upcoming";
}

export function StorefrontFunnelSteps({
  active,
  ariaLabel,
  labels,
}: StorefrontFunnelStepsProps) {
  const items: Array<{ id: StorefrontFunnelStepId; label: string }> = [
    { id: "cart", label: labels.cart },
    { id: "checkout", label: labels.checkout },
    { id: "done", label: labels.done },
  ];

  return (
    <ol
      aria-label={ariaLabel}
      className="flex w-full max-w-md items-center gap-1 sm:gap-2"
    >
      {items.map((item, index) => {
        const state = stepState(item.id, active);
        const isLast = index === items.length - 1;

        return (
          <li
            key={item.id}
            className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2"
          >
            <div className="flex min-w-0 flex-col items-center gap-1.5">
              <span
                aria-current={state === "current" ? "step" : undefined}
                className={
                  state === "current"
                    ? "bg-primary text-on-primary font-label text-label-bold flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
                    : state === "complete"
                      ? "bg-secondary text-on-secondary flex h-8 w-8 items-center justify-center rounded-full"
                      : "bg-surface-container-high text-on-surface-variant font-label text-label-bold flex h-8 w-8 items-center justify-center rounded-full"
                }
              >
                {state === "complete" ? (
                  <Check className="h-4 w-4" aria-hidden strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={
                  state === "current"
                    ? "font-label text-label-bold text-primary text-center text-[11px] leading-tight sm:text-xs"
                    : "font-body text-on-surface-variant text-center text-[11px] leading-tight sm:text-xs"
                }
              >
                {item.label}
              </span>
            </div>
            {!isLast ? (
              <div
                aria-hidden
                className={
                  state === "complete"
                    ? "bg-secondary mb-5 h-0.5 min-w-4 flex-1 rounded-full"
                    : "bg-outline-variant/50 mb-5 h-0.5 min-w-4 flex-1 rounded-full"
                }
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
