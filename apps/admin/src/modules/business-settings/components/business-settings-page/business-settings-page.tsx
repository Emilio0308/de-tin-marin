"use client";

import type { ReactNode } from "react";
import { Building2, Info, MessageCircle, Save } from "lucide-react";
import type { BusinessSettingsPageProps } from "./business-settings-page.types";
import { sanitizeDigits } from "./business-settings-page.helpers";

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

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}

export function BusinessSettingsPage({
  labels,
  values,
  loading,
  loadError,
  submitting,
  message,
  error,
  onChange,
  onSave,
}: BusinessSettingsPageProps) {
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
          icon={<MessageCircle className="h-5 w-5" aria-hidden />}
          title={labels.sectionContact}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="whatsappE164"
            label={labels.whatsappE164}
            hint={labels.whatsappHint}
          >
            <input
              id="whatsappE164"
              inputMode="numeric"
              autoComplete="tel"
              className={fieldClass}
              value={values.whatsappE164}
              onChange={(event) =>
                onChange({ whatsappE164: sanitizeDigits(event.target.value) })
              }
            />
          </Field>
          <Field id="email" label={labels.email} hint={labels.emailHint}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={fieldClass}
              value={values.email}
              onChange={(event) => onChange({ email: event.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader
          icon={<Building2 className="h-5 w-5" aria-hidden />}
          title={labels.sectionPayments}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="yapePhone"
            label={labels.yapePhone}
            hint={labels.yapePhoneHint}
          >
            <input
              id="yapePhone"
              inputMode="numeric"
              className={fieldClass}
              value={values.yapePhone}
              onChange={(event) =>
                onChange({ yapePhone: sanitizeDigits(event.target.value) })
              }
            />
          </Field>
          <Field id="yapeHolderName" label={labels.yapeHolderName}>
            <input
              id="yapeHolderName"
              className={fieldClass}
              value={values.yapeHolderName}
              onChange={(event) =>
                onChange({ yapeHolderName: event.target.value })
              }
            />
          </Field>
          <Field id="bankName" label={labels.bankName}>
            <input
              id="bankName"
              className={fieldClass}
              value={values.bankName}
              onChange={(event) => onChange({ bankName: event.target.value })}
            />
          </Field>
          <Field
            id="bankAccountHolderName"
            label={labels.bankAccountHolderName}
          >
            <input
              id="bankAccountHolderName"
              className={fieldClass}
              value={values.bankAccountHolderName}
              onChange={(event) =>
                onChange({ bankAccountHolderName: event.target.value })
              }
            />
          </Field>
          <Field
            id="bankAccountNumber"
            label={labels.bankAccountNumber}
            hint={labels.bankAccountNumberHint}
          >
            <input
              id="bankAccountNumber"
              className={fieldClass}
              value={values.bankAccountNumber}
              onChange={(event) =>
                onChange({ bankAccountNumber: event.target.value })
              }
            />
          </Field>
          <Field
            id="bankInterbankAccountNumber"
            label={labels.bankInterbankAccountNumber}
            hint={labels.bankInterbankAccountNumberHint}
          >
            <input
              id="bankInterbankAccountNumber"
              inputMode="numeric"
              className={fieldClass}
              value={values.bankInterbankAccountNumber}
              onChange={(event) =>
                onChange({
                  bankInterbankAccountNumber: sanitizeDigits(
                    event.target.value,
                  ),
                })
              }
            />
          </Field>
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
