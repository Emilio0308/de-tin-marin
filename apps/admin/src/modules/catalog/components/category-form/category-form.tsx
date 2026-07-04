"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronRight,
  Info,
  Minus,
  Plus,
  Save,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import {
  buildInitialCategoryValues,
  CATEGORY_DESCRIPTION_MAX,
  CATEGORY_NAME_MAX,
  slugFromName,
} from "./category-form.helpers";
import type { CategoryFormProps } from "./category-form.types";

const cardClass =
  "bg-surface-container-lowest border-outline-variant/40 flex flex-col gap-4 rounded-2xl border p-5 shadow-sm lg:p-8";
const labelClass =
  "font-label text-label-bold text-on-surface-variant text-xs uppercase tracking-wide";
const fieldClass =
  "border-outline-variant/40 focus:border-secondary bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors";

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

export function CategoryForm({
  initial,
  labels,
  onSubmit,
  onCancel,
  submitting,
  error,
}: CategoryFormProps) {
  const [values, setValues] = useState(() =>
    buildInitialCategoryValues(initial),
  );
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));

  function setField<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string) {
    setValues((prev) => ({
      ...prev,
      name,
      slug: slugEdited ? prev.slug : slugFromName(name),
    }));
  }

  function handleSlugChange(slug: string) {
    setSlugEdited(true);
    setField("slug", slug);
  }

  function adjustSortOrder(delta: number) {
    setValues((prev) => ({
      ...prev,
      sortOrder: Math.max(0, prev.sortOrder + delta),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values);
  }

  const previewName = values.name.trim() || labels.previewFallback;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <nav className="font-label text-on-surface-variant flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide">
          <span>{labels.breadcrumbParent}</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
          <span className="text-primary">{labels.breadcrumbCurrent}</span>
        </nav>
        <h1 className="font-display text-on-surface text-[32px] font-extrabold leading-10 tracking-tight lg:text-[40px]">
          {labels.title}
        </h1>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-6"
      >
        <section className={cardClass}>
          <SectionHeader
            icon={<Info className="h-5 w-5" aria-hidden />}
            title={labels.sectionGeneral}
          />
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="name">
              <span className="text-on-surface normal-case">{labels.name}</span>
              <span className="text-error ml-2 text-[10px] normal-case">
                {labels.nameRequired}
              </span>
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={CATEGORY_NAME_MAX}
              value={values.name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder={labels.namePlaceholder}
              className={fieldClass}
            />
            <p className="text-on-surface-variant text-right text-[10px] uppercase tracking-wider">
              {labels.formatNameCounter(values.name.length, CATEGORY_NAME_MAX)}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="description">
              <span className="text-on-surface normal-case">
                {labels.description}
              </span>
              <span className="text-on-surface-variant/70 ml-2 text-[10px] normal-case">
                ({labels.descriptionOptional})
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={CATEGORY_DESCRIPTION_MAX}
              value={values.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder={labels.descriptionPlaceholder}
              className={cn(fieldClass, "min-h-[120px] resize-none")}
            />
            <p className="text-on-surface-variant text-right text-[10px] uppercase tracking-wider lg:hidden">
              {labels.descriptionMaxHint}
            </p>
            <p className="text-on-surface-variant hidden text-right text-[10px] uppercase tracking-wider lg:block">
              {labels.formatDescriptionCounter(
                values.description.length,
                CATEGORY_DESCRIPTION_MAX,
              )}
            </p>
          </div>
        </section>

        <section className={cardClass}>
          <SectionHeader
            icon={<Settings className="h-5 w-5" aria-hidden />}
            title={labels.sectionConfig}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="slug">
                <span className="text-on-surface normal-case">
                  {labels.slug}
                </span>
                <span className="text-error ml-2 text-[10px] normal-case">
                  {labels.slugUnique}
                </span>
              </label>
              <div className="border-outline-variant/40 focus-within:border-secondary bg-surface-container-low flex items-center rounded-xl border-2 px-4 py-3 transition-colors">
                <span className="text-on-surface-variant/60 font-body text-sm">
                  {labels.slugPrefix}
                </span>
                <input
                  id="slug"
                  name="slug"
                  required
                  value={values.slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  placeholder={labels.slugPlaceholder}
                  className="text-secondary font-body text-body-md ml-1 flex-1 border-none bg-transparent p-0 outline-none"
                />
              </div>
              <p className="text-on-surface-variant/70 text-xs">
                {labels.slugHint}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="sortOrder">
                <span className="text-on-surface normal-case lg:hidden">
                  {labels.sortOrderShort}
                </span>
                <span className="text-on-surface hidden normal-case lg:inline">
                  {labels.sortOrder}
                </span>
              </label>
              <div className="border-outline-variant/40 bg-surface-container-low flex items-center justify-between rounded-xl border-2 p-1">
                <button
                  type="button"
                  onClick={() => adjustSortOrder(-1)}
                  aria-label={labels.sortOrderDecrease}
                  className="press-down text-primary flex h-10 w-10 items-center justify-center rounded-lg"
                >
                  <Minus className="h-5 w-5" aria-hidden />
                </button>
                <input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min={0}
                  required
                  value={values.sortOrder}
                  onChange={(event) =>
                    setField(
                      "sortOrder",
                      Math.max(0, Math.floor(Number(event.target.value) || 0)),
                    )
                  }
                  className="text-primary font-display text-headline-md w-full border-none bg-transparent text-center outline-none [appearance:textfield] focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => adjustSortOrder(1)}
                  aria-label={labels.sortOrderIncrease}
                  className="press-down text-primary flex h-10 w-10 items-center justify-center rounded-lg"
                >
                  <Plus className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface-container flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-label text-label-bold text-on-surface">
                {labels.statusActiveTitle}
              </p>
              <p className="text-on-surface-variant/70 text-xs">
                {labels.statusActiveHint}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "font-label text-label-bold",
                  values.isActive
                    ? "text-secondary"
                    : "text-on-surface-variant",
                )}
              >
                {values.isActive ? labels.statusYes : labels.statusNo}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={values.isActive}
                aria-label={labels.statusActiveTitle}
                onClick={() => setField("isActive", !values.isActive)}
                className={cn(
                  "inline-flex h-7 w-14 shrink-0 items-center rounded-full px-0.5 transition-colors duration-200",
                  values.isActive
                    ? "bg-primary"
                    : "bg-surface-container-highest",
                )}
              >
                <span
                  className={cn(
                    "h-6 w-6 rounded-full bg-white shadow transition-transform duration-200",
                    values.isActive ? "translate-x-7" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>

          <div className="bg-secondary-container/20 border-secondary/10 flex items-start gap-3 rounded-xl border p-4 lg:hidden">
            <Sparkles className="text-secondary h-5 w-5 shrink-0" aria-hidden />
            <div>
              <h4 className="font-label text-label-bold text-on-secondary-container">
                {labels.tipTitle}
              </h4>
              <p className="text-on-secondary-fixed-variant mt-1 text-xs leading-tight">
                {labels.tipBody}
              </p>
            </div>
          </div>
        </section>

        <section className="hidden gap-4 lg:grid lg:grid-cols-3">
          <div className="bg-tertiary-container/10 border-tertiary-container/20 flex flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center">
            <Sparkles className="text-tertiary h-8 w-8" aria-hidden />
            <p className="font-label text-label-bold text-tertiary">
              {labels.tipTitle}
            </p>
            <p className="text-on-surface-variant text-sm">{labels.tipBody}</p>
          </div>
          <div className="relative h-48 overflow-hidden rounded-xl shadow-lg lg:col-span-2">
            <div className="from-primary via-secondary to-tertiary h-full w-full bg-gradient-to-br" />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
              <div>
                <span className="bg-primary text-on-primary mb-2 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  {labels.previewLabel}
                </span>
                <h4 className="font-display text-headline-md text-white">
                  {previewName}
                </h4>
              </div>
            </div>
          </div>
        </section>

        <div className="border-outline-variant/10 bg-surface/95 px-margin-mobile fixed inset-x-0 bottom-0 z-30 border-t pb-8 pt-4 backdrop-blur-xl lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {error ? (
              <p className="text-error font-body text-body-md sm:mr-auto">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onCancel}
              className="border-secondary text-secondary hover:bg-secondary/5 press-down font-label text-label-bold min-h-12 flex-1 rounded-full border-2 px-8 py-3 transition-colors sm:flex-none"
            >
              {labels.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-on-primary hover:bg-primary-container press-down font-label text-label-bold shadow-primary/20 inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-8 py-3 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              <Save className="h-5 w-5" aria-hidden />
              {submitting ? labels.saving : labels.save}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
