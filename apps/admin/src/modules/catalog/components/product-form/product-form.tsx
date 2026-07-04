"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ChevronRight,
  ImageIcon,
  Minus,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { ProductFormProps, ProductFormValues } from "./product-form.types";
import {
  buildInitialProductValues,
  isValidImageUrl,
  slugify,
} from "./product-form.helpers";

const cardClass =
  "bg-surface-container-lowest border-outline-variant/40 flex flex-col gap-4 rounded-2xl border p-5 shadow-sm";
const labelClass =
  "font-label text-label-bold text-on-surface-variant text-xs uppercase tracking-wide";
const fieldClass =
  "border-outline-variant/40 focus:border-secondary bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors";

export function ProductForm({
  initial,
  categories,
  labels,
  onSubmit,
  onCancel,
  submitting,
  error,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(() =>
    buildInitialProductValues(initial),
  );
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));

  function setField<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string) {
    setValues((prev) => ({
      ...prev,
      name,
      slug: slugEdited ? prev.slug : slugify(name),
    }));
  }

  function handleSlugChange(slug: string) {
    setSlugEdited(true);
    setField("slug", slug);
  }

  function adjustStock(delta: number) {
    setValues((prev) => ({
      ...prev,
      stockQuantity: Math.max(0, prev.stockQuantity + delta),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
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
        className="grid gap-6 lg:grid-cols-2"
      >
        {/* Estado + SKU */}
        <section className={cardClass}>
          <div className="flex items-center justify-between">
            <span className={labelClass}>{labels.status}</span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-label text-label-bold",
                  values.isActive
                    ? "text-secondary"
                    : "text-on-surface-variant",
                )}
              >
                {values.isActive ? labels.statusActive : labels.statusInactive}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={values.isActive}
                aria-label={labels.statusToggle}
                onClick={() => setField("isActive", !values.isActive)}
                className={cn(
                  "relative inline-flex h-7 w-14 shrink-0 items-center rounded-full px-0.5 transition-colors duration-200",
                  values.isActive
                    ? "bg-secondary"
                    : "bg-surface-container-high",
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
          <div className="bg-outline-variant/20 h-px w-full" />
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="sku">
              {labels.sku}
            </label>
            <input
              id="sku"
              name="sku"
              required
              value={values.sku}
              onChange={(event) => setField("sku", event.target.value)}
              placeholder={labels.skuPlaceholder}
              className={fieldClass}
            />
          </div>
        </section>

        {/* Nombre + Slug */}
        <section className={cardClass}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="name">
              {labels.name}
            </label>
            <input
              id="name"
              name="name"
              required
              value={values.name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder={labels.namePlaceholder}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="slug">
              {labels.slug}
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
          </div>
        </section>

        {/* Imagen */}
        <section className={cardClass}>
          <span className={labelClass}>{labels.image}</span>
          <div className="border-outline-variant/60 bg-surface-container-high relative aspect-video w-full overflow-hidden rounded-xl border">
            {isValidImageUrl(values.imageUrl) ? (
              <Image
                src={values.imageUrl}
                alt={labels.imageAlt}
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-cover"
              />
            ) : (
              <div className="text-on-surface-variant/40 flex h-full flex-col items-center justify-center gap-2">
                <ImageIcon className="h-12 w-12" aria-hidden />
                <span className="font-label text-label-bold">
                  {labels.imagePreview}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="imageUrl">
              {labels.imageUrl}
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              value={values.imageUrl}
              onChange={(event) => setField("imageUrl", event.target.value)}
              placeholder={labels.imageUrlPlaceholder}
              className={fieldClass}
            />
          </div>
        </section>

        {/* Marca + Categoría */}
        <section className={cardClass}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="brand">
              {labels.brand}
            </label>
            <input
              id="brand"
              name="brand"
              value={values.brand}
              onChange={(event) => setField("brand", event.target.value)}
              placeholder={labels.brandPlaceholder}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="categoryId">
              {labels.category}
            </label>
            <div className="relative">
              <select
                id="categoryId"
                name="categoryId"
                required
                value={values.categoryId}
                onChange={(event) => setField("categoryId", event.target.value)}
                className={cn(
                  fieldClass,
                  "cursor-pointer appearance-none pr-10",
                )}
              >
                <option value="" disabled>
                  {labels.categoryPlaceholder}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronRight
                className="text-on-surface-variant pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 rotate-90"
                aria-hidden
              />
            </div>
          </div>
        </section>

        {/* Precio + Stock */}
        <section className={cardClass}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="netPrice">
              {labels.price}
            </label>
            <div className="relative">
              <span className="text-on-surface absolute left-4 top-1/2 -translate-y-1/2 font-bold">
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
                className={cn(
                  fieldClass,
                  "font-display text-primary pl-10 text-[20px] font-extrabold",
                )}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>{labels.stock}</span>
            <div className="border-outline-variant/40 bg-surface-container-low flex items-center justify-between rounded-full border-2 p-1.5">
              <button
                type="button"
                onClick={() => adjustStock(-1)}
                aria-label={labels.stockDecrease}
                className="press-down border-outline-variant/30 text-primary flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm"
              >
                <Minus className="h-5 w-5" aria-hidden />
              </button>
              <input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                min={0}
                required
                value={values.stockQuantity}
                onChange={(event) =>
                  setField(
                    "stockQuantity",
                    Math.max(0, Math.floor(Number(event.target.value) || 0)),
                  )
                }
                className="text-on-surface w-full flex-1 border-none bg-transparent text-center text-xl font-bold outline-none [appearance:textfield] focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => adjustStock(1)}
                aria-label={labels.stockIncrease}
                className="press-down bg-primary text-on-primary flex h-10 w-10 items-center justify-center rounded-full shadow-md"
              >
                <Plus className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </section>

        {/* Descripción */}
        <section className={cardClass}>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className={labelClass} htmlFor="description">
              {labels.description}
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={values.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder={labels.descriptionPlaceholder}
              className={cn(fieldClass, "min-h-[120px] flex-1 resize-none")}
            />
          </div>
        </section>

        {/* Tip */}
        <div className="bg-tertiary-fixed border-on-tertiary-fixed-variant/10 flex items-start gap-4 rounded-2xl border p-6 lg:col-span-2">
          <span className="bg-tertiary text-on-tertiary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h4 className="font-label text-label-bold text-on-tertiary-fixed">
              {labels.tipTitle}
            </h4>
            <p className="font-body text-body-md text-on-tertiary-fixed/80 mt-1">
              {labels.tipBody}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="border-outline-variant/20 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-end lg:col-span-2">
          {error ? (
            <p className="text-error font-body text-body-md sm:mr-auto">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="border-secondary text-secondary hover:bg-secondary/5 press-down font-label text-label-bold min-h-12 rounded-full border-2 px-8 py-3 transition-colors"
          >
            {labels.cancel}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-on-primary hover:bg-primary-container press-down font-label text-label-bold shadow-primary/20 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-8 py-3 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-5 w-5" aria-hidden />
            {submitting ? labels.saving : labels.save}
          </button>
        </div>
      </form>
    </div>
  );
}
