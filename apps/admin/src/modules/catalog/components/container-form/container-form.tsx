"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import {
  Box,
  ChevronRight,
  ImageIcon,
  Info,
  Minus,
  Plus,
  Save,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import {
  buildInitialContainerValues,
  CONTAINER_DESCRIPTION_MAX,
  CONTAINER_NAME_MAX,
  formatContainerPrice,
  isValidImageUrl,
} from "./container-form.helpers";
import type { ContainerFormProps } from "./container-form.types";

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

export function ContainerForm({
  initial,
  labels,
  onSubmit,
  onCancel,
  submitting,
  error,
}: ContainerFormProps) {
  const [values, setValues] = useState(() =>
    buildInitialContainerValues(initial),
  );
  const [imageError, setImageError] = useState<string | null>(null);

  function setField<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === "imageUrl") {
      setImageError(null);
    }
  }

  function adjustStock(delta: number) {
    setValues((prev) => ({
      ...prev,
      stockQuantity: Math.max(0, prev.stockQuantity + delta),
    }));
  }

  function handleVerifyImage() {
    if (!values.imageUrl.trim()) {
      setImageError(null);
      return;
    }
    setImageError(
      isValidImageUrl(values.imageUrl) ? null : labels.imageInvalid,
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values);
  }

  const previewName = values.name.trim() || labels.previewFallback;
  const showImagePreview = isValidImageUrl(values.imageUrl);

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
            title={labels.sectionInfo}
          />
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="sku">
              <span className="text-on-surface normal-case">{labels.sku}</span>
              <span className="text-error ml-2 text-[10px] normal-case">
                {labels.skuRequired}
              </span>
            </label>
            <input
              id="sku"
              name="sku"
              required
              maxLength={64}
              value={values.sku}
              onChange={(event) => setField("sku", event.target.value)}
              placeholder={labels.skuPlaceholder}
              className={fieldClass}
            />
          </div>
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
              maxLength={CONTAINER_NAME_MAX}
              value={values.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder={labels.namePlaceholder}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="description">
              <span className="text-on-surface normal-case">
                {labels.description}
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={CONTAINER_DESCRIPTION_MAX}
              value={values.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder={labels.descriptionPlaceholder}
              className={cn(fieldClass, "min-h-[120px] resize-none")}
            />
          </div>
        </section>

        <section className={cardClass}>
          <SectionHeader
            icon={<ImageIcon className="h-5 w-5" aria-hidden />}
            title={labels.sectionImage}
          />
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="imageUrl">
              {labels.imageUrl}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={values.imageUrl}
                onChange={(event) => setField("imageUrl", event.target.value)}
                onBlur={handleVerifyImage}
                placeholder={labels.imageUrlPlaceholder}
                className={cn(fieldClass, "flex-1")}
              />
              <button
                type="button"
                onClick={handleVerifyImage}
                className="border-secondary text-secondary hover:bg-secondary/5 press-down font-label text-label-bold min-h-12 rounded-full border-2 px-6 py-3 transition-colors"
              >
                {labels.imageVerify}
              </button>
            </div>
            {imageError ? (
              <p className="text-error text-sm">{imageError}</p>
            ) : null}
          </div>
          <div className="border-outline-variant/60 bg-surface-container-high relative aspect-square w-full max-w-sm overflow-hidden rounded-xl border">
            {showImagePreview ? (
              <Image
                src={values.imageUrl}
                alt={labels.imageAlt}
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-cover"
              />
            ) : (
              <div className="text-on-surface-variant/40 flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <ImageIcon className="h-12 w-12" aria-hidden />
                <span className="font-label text-label-bold">
                  {labels.imagePreview}
                </span>
                <span className="text-xs">{labels.imagePreviewEmpty}</span>
              </div>
            )}
          </div>
          <p className="text-on-surface-variant/70 text-xs">
            {labels.imageHint}
          </p>
        </section>

        <section className={cardClass}>
          <SectionHeader
            icon={<Wallet className="h-5 w-5" aria-hidden />}
            title={labels.sectionFinance}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="netPrice">
                <span className="text-on-surface normal-case">
                  {labels.netPrice}
                </span>
                <span className="text-error ml-2 text-[10px] normal-case">
                  {labels.netPriceRequired}
                </span>
              </label>
              <div className="border-outline-variant/40 focus-within:border-secondary bg-surface-container-low flex items-center rounded-xl border-2 px-4 py-3 transition-colors">
                <span className="text-on-surface-variant font-body text-sm">
                  S/
                </span>
                <input
                  id="netPrice"
                  name="netPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={values.netPrice}
                  onChange={(event) =>
                    setField("netPrice", Number(event.target.value) || 0)
                  }
                  className="text-primary font-body text-body-md ml-2 flex-1 border-none bg-transparent p-0 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="stockQuantity">
                <span className="text-on-surface normal-case lg:hidden">
                  {labels.stockShort}
                </span>
                <span className="text-on-surface hidden normal-case lg:inline">
                  {labels.stock}
                </span>
                <span className="text-error ml-2 text-[10px] normal-case">
                  {labels.stockRequired}
                </span>
              </label>
              <div className="border-outline-variant/40 bg-surface-container-low flex items-center justify-between rounded-xl border-2 p-1">
                <button
                  type="button"
                  onClick={() => adjustStock(-1)}
                  aria-label={labels.stockDecrease}
                  className="press-down text-primary flex h-10 w-10 items-center justify-center rounded-lg"
                >
                  <Minus className="h-5 w-5" aria-hidden />
                </button>
                <input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={values.stockQuantity}
                  onChange={(event) =>
                    setField(
                      "stockQuantity",
                      Math.max(0, Math.floor(Number(event.target.value) || 0)),
                    )
                  }
                  className="text-primary font-display text-headline-md w-full border-none bg-transparent text-center outline-none [appearance:textfield] focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => adjustStock(1)}
                  aria-label={labels.stockIncrease}
                  className="press-down text-primary flex h-10 w-10 items-center justify-center rounded-lg"
                >
                  <Plus className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <SectionHeader
            icon={<Settings className="h-5 w-5" aria-hidden />}
            title={labels.sectionConfig}
          />
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
            {showImagePreview ? (
              <Image
                src={values.imageUrl}
                alt={labels.imageAlt}
                fill
                unoptimized
                sizes="600px"
                className="object-cover"
              />
            ) : (
              <div className="from-primary via-secondary to-tertiary h-full w-full bg-gradient-to-br" />
            )}
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
              <div>
                <span className="bg-primary text-on-primary mb-2 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  {labels.previewLabel}
                </span>
                <h4 className="font-display text-headline-md text-white">
                  {previewName}
                </h4>
                <p className="mt-1 text-sm text-white/80">
                  S/ {formatContainerPrice(values.netPrice)}
                </p>
              </div>
            </div>
            {!showImagePreview ? (
              <Box className="absolute right-6 top-6 h-10 w-10 text-white/30" />
            ) : null}
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
