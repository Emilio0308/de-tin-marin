import { cn } from "@de-tin-marin/shared/cn";

export type AdminCatalogStatusToggleProps = {
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
  activeLabel: string;
  inactiveLabel: string;
  ariaActivate: string;
  ariaDeactivate: string;
};

export function AdminCatalogStatusToggle({
  active,
  disabled = false,
  onToggle,
  activeLabel,
  inactiveLabel,
  ariaActivate,
  ariaDeactivate,
}: AdminCatalogStatusToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? ariaDeactivate : ariaActivate}
      disabled={disabled}
      onClick={onToggle}
      className="inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={cn(
          "inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors duration-200",
          active ? "bg-secondary" : "bg-surface-container-high",
        )}
      >
        <span
          className={cn(
            "h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
            active ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
      <span className="font-label text-label-bold text-on-surface-variant">
        {active ? activeLabel : inactiveLabel}
      </span>
    </button>
  );
}
