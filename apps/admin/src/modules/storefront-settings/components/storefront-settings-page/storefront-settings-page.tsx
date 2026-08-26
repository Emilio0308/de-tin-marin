"use client";

import type { ReactNode } from "react";
import { cn } from "@de-tin-marin/shared/cn";
import { GranularNumberInput } from "@/shared/forms/granular-number-input";
import { Info, Megaphone, Save, Store, Truck } from "lucide-react";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "./storefront-settings-page.helpers";
import type { StorefrontSettingsPageProps } from "./storefront-settings-page.types";

const cardClass =
  "bg-surface-container-lowest border-outline-variant/40 flex flex-col gap-4 rounded-2xl border p-5 shadow-sm lg:p-8";
const labelClass =
  "font-label text-label-bold text-on-surface-variant text-xs uppercase tracking-wide";
const fieldClass =
  "border-outline-variant/40 focus:border-secondary bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors";
const hintClass = "text-on-surface-variant/70 text-xs";

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
        <p className={hintClass}>{hint}</p>
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

export function StorefrontSettingsPage({
  labels,
  values,
  loading,
  loadError,
  submitting,
  message,
  error,
  onChange,
  onSave,
}: StorefrontSettingsPageProps) {
  if (loading) {
    return (
      <p className="font-body text-body-md text-on-surface-variant">
        {labels.loading}
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="font-body text-body-md text-error" role="alert">
        {loadError}
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-2">
        <h1 className="font-display text-display-lg-mobile text-on-surface">
          {labels.title}
        </h1>
        <p className="font-body text-body-md text-on-surface-variant">
          {labels.subtitle}
        </p>
      </header>

      <section className={cardClass}>
        <SectionHeader
          icon={<Truck className="h-5 w-5" aria-hidden />}
          title={labels.sectionPromo}
        />
        <SettingsToggle
          title={labels.freeDelivery}
          hint={labels.freeDeliveryHint}
          checked={values.freeDelivery}
          onChange={(freeDelivery) => onChange({ freeDelivery })}
        />
        <SettingsToggle
          title={labels.freePickupPoint}
          hint={labels.freePickupPointHint}
          checked={values.freePickupPoint}
          onChange={(freePickupPoint) => onChange({ freePickupPoint })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="freeWindowStart" className={labelClass}>
              {labels.freeWindowStart}
            </label>
            <input
              id="freeWindowStart"
              type="datetime-local"
              className={fieldClass}
              value={toDatetimeLocalValue(values.freeFulfillmentStartsAt)}
              onChange={(event) =>
                onChange({
                  freeFulfillmentStartsAt: fromDatetimeLocalValue(
                    event.target.value,
                  ),
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="freeWindowEnd" className={labelClass}>
              {labels.freeWindowEnd}
            </label>
            <input
              id="freeWindowEnd"
              type="datetime-local"
              className={fieldClass}
              value={toDatetimeLocalValue(values.freeFulfillmentEndsAt)}
              onChange={(event) =>
                onChange({
                  freeFulfillmentEndsAt: fromDatetimeLocalValue(
                    event.target.value,
                  ),
                })
              }
            />
          </div>
        </div>
        <p className={hintClass}>{labels.freeWindowHint}</p>
      </section>

      <section className={cardClass}>
        <SectionHeader
          icon={<Store className="h-5 w-5" aria-hidden />}
          title={labels.sectionMinOrder}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="minOrderSubtotal" className={labelClass}>
            {labels.minOrderSubtotal}
          </label>
          <div className="border-outline-variant/40 focus-within:border-secondary bg-surface-container-low flex max-w-xs items-center rounded-xl border-2 px-4 py-3 transition-colors">
            <span className="text-on-surface-variant font-body text-sm">
              S/
            </span>
            <GranularNumberInput
              id="minOrderSubtotal"
              mode="decimal"
              min={0}
              emptyFallback={0}
              value={values.minOrderSubtotal}
              onValueChange={(next) =>
                onChange({ minOrderSubtotal: next ?? 0 })
              }
              className="text-primary font-body text-body-md ml-2 w-full border-none bg-transparent p-0 outline-none"
            />
          </div>
          <p className={hintClass}>{labels.minOrderHint}</p>
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader
          icon={<Megaphone className="h-5 w-5" aria-hidden />}
          title={labels.sectionAnnouncement}
        />
        <SettingsToggle
          title={labels.announcementEnabled}
          hint={labels.announcementEnabledHint}
          checked={values.announcementEnabled}
          onChange={(announcementEnabled) => onChange({ announcementEnabled })}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="announcementMessage" className={labelClass}>
            {labels.announcementMessage}
          </label>
          <textarea
            id="announcementMessage"
            rows={3}
            maxLength={500}
            className={fieldClass}
            value={values.announcementMessage ?? ""}
            onChange={(event) =>
              onChange({
                announcementMessage: event.target.value || null,
              })
            }
          />
          <p className={hintClass}>{labels.announcementMessageHint}</p>
        </div>
      </section>

      <div className="bg-surface-container-low flex items-start gap-3 rounded-2xl p-4">
        <Info className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p className="font-body text-body-sm text-on-surface-variant">
          {labels.infoTip}
        </p>
      </div>

      {error ? (
        <p className="font-body text-body-md text-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="font-body text-body-md text-secondary" role="status">
          {message}
        </p>
      ) : null}

      <div>
        <button
          type="button"
          disabled={submitting}
          onClick={onSave}
          className="bg-primary text-on-primary font-label text-label-bold inline-flex min-h-12 items-center gap-2 rounded-full px-6 transition-opacity disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden />
          {submitting ? labels.saving : labels.save}
        </button>
      </div>
    </div>
  );
}
