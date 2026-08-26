"use client";

import type { ReactNode } from "react";
import { Info, Save, Settings } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import { GranularNumberInput } from "@/shared/forms/granular-number-input";
import type { DeliveryGlobalSettingsProps } from "./delivery-settings.types";

const cardClass =
  "bg-surface-container-lowest border-outline-variant/40 flex flex-col gap-4 rounded-2xl border p-5 shadow-sm lg:p-8";
const labelClass =
  "font-label text-label-bold text-on-surface-variant text-xs uppercase tracking-wide";

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-primary-fixed text-primary flex h-10 w-10 items-center justify-center rounded-lg">
        {icon}
      </span>
      <h2 className="font-display text-headline-md text-on-surface font-bold">
        {title}
      </h2>
    </div>
  );
}

function SettingsToggle({
  title,
  hint,
  checked,
  onChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="bg-surface-container flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-label text-label-bold text-on-surface">{title}</p>
        <p className="text-on-surface-variant/70 text-xs">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={cn(
          "inline-flex h-7 w-14 shrink-0 items-center rounded-full px-0.5 transition-colors duration-200",
          checked ? "bg-primary" : "bg-surface-container-highest",
        )}
      >
        <span
          className={cn(
            "h-6 w-6 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-7" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

export function DeliveryGlobalSettings({
  settings,
  labels,
  settingsSubmitting,
  settingsError,
  onSettingsChange,
  onSaveSettings,
}: DeliveryGlobalSettingsProps) {
  return (
    <section className={cardClass}>
      <SectionHeader
        icon={<Settings className="h-5 w-5" aria-hidden />}
        title={labels.sectionGlobal}
      />
      <div className="flex flex-col gap-3">
        <SettingsToggle
          title={labels.pickupEnabled}
          hint={labels.pickupHint}
          checked={settings.pickupEnabled}
          onChange={(pickupEnabled) =>
            onSettingsChange({ ...settings, pickupEnabled })
          }
        />
        <SettingsToggle
          title={labels.pickupPointsEnabled}
          hint={labels.pickupPointsHint}
          checked={settings.pickupPointsEnabled}
          onChange={(pickupPointsEnabled) =>
            onSettingsChange({ ...settings, pickupPointsEnabled })
          }
        />
        <SettingsToggle
          title={labels.deliveryEnabled}
          hint={labels.deliveryHint}
          checked={settings.deliveryEnabled}
          onChange={(deliveryEnabled) =>
            onSettingsChange({ ...settings, deliveryEnabled })
          }
        />
        <SettingsToggle
          title={labels.courierEnabled}
          hint={labels.courierHint}
          checked={settings.courierEnabled}
          onChange={(courierEnabled) =>
            onSettingsChange({ ...settings, courierEnabled })
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="fallbackFee">
          <span className="text-on-surface normal-case">
            {labels.fallbackFee}
          </span>
        </label>
        <div className="border-outline-variant/40 focus-within:border-secondary bg-surface-container-low flex max-w-xs items-center rounded-xl border-2 px-4 py-3 transition-colors">
          <span className="text-on-surface-variant font-body text-sm">S/</span>
          <GranularNumberInput
            id="fallbackFee"
            mode="decimal"
            min={0}
            emptyFallback={0}
            value={settings.fallbackFee}
            onValueChange={(next) =>
              onSettingsChange({
                ...settings,
                fallbackFee: next ?? 0,
              })
            }
            className="text-primary font-body text-body-md ml-2 w-full border-none bg-transparent p-0 outline-none"
          />
        </div>
        <p className="text-on-surface-variant/70 flex items-start gap-2 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {labels.fallbackHint}
        </p>
      </div>
      {settingsError ? (
        <p className="text-error font-body text-body-md">{settingsError}</p>
      ) : null}
      <button
        type="button"
        disabled={settingsSubmitting}
        onClick={onSaveSettings}
        className="bg-primary text-on-primary hover:bg-primary-container press-down font-label text-label-bold shadow-primary/20 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-8 py-3 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
      >
        <Save className="h-5 w-5" aria-hidden />
        {settingsSubmitting ? labels.savingSettings : labels.saveSettings}
      </button>
    </section>
  );
}
