"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronRight,
  Gift,
  ImageIcon,
  Info,
  Minus,
  Package,
  Plus,
  Save,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import {
  addBundleItem,
  buildDefaultBundleValues,
  computeLiveTotal,
  isValidImageUrl,
  removeBundleItem,
  setBundleItemUnits,
} from "./bundle-form.helpers";
import type { BundleFormLabels, BundleFormProps } from "./bundle-form.types";

const cardClass =
  "bg-surface-container-lowest border-outline-variant/40 flex flex-col gap-4 rounded-2xl border p-5 shadow-sm";
const labelClass =
  "font-label text-label-bold text-on-surface-variant text-xs uppercase tracking-wide";
const fieldClass =
  "border-outline-variant/40 focus:border-secondary bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors";

function formatPrice(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-tertiary" aria-hidden>
        {icon}
      </span>
      <h2 className="font-label text-label-bold text-on-surface-variant uppercase tracking-wider">
        {title}
      </h2>
    </div>
  );
}

function UnitStepper({
  value,
  onDecrease,
  onIncrease,
  labels,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  labels: BundleFormLabels;
}) {
  return (
    <div className="bg-surface-container-high flex items-center gap-3 rounded-full p-1">
      <button
        type="button"
        onClick={onDecrease}
        aria-label={labels.decreaseUnits}
        className="press-down text-secondary flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
      >
        <Minus className="h-[18px] w-[18px]" aria-hidden />
      </button>
      <span className="font-label text-label-bold text-on-surface w-4 text-center">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={labels.increaseUnits}
        className="press-down bg-secondary flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm"
      >
        <Plus className="h-[18px] w-[18px]" aria-hidden />
      </button>
    </div>
  );
}

export function BundleForm({
  initial,
  products,
  containers,
  labels,
  onSubmit,
  onCancel,
  submitting,
  error,
}: BundleFormProps) {
  const [values, setValues] = useState(() => buildDefaultBundleValues(initial));
  const [selectedProductId, setSelectedProductId] = useState("");

  const availableProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          !values.items.some((item) => item.productId === product.id),
      ),
    [products, values.items],
  );

  const priceSummary = useMemo(
    () => computeLiveTotal(values, products, containers),
    [values, products, containers],
  );

  const selectedContainerPrice = useMemo(
    () =>
      containers.find((container) => container.id === values.containerId)
        ?.netPrice ?? 0,
    [containers, values.containerId],
  );

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await onSubmit(values);
    } catch {
      // El container maneja errores; evitar unhandled rejection.
    }
  }

  function handleAddProduct() {
    if (!selectedProductId) return;
    setValues((current) => ({
      ...current,
      items: addBundleItem(current.items, selectedProductId),
    }));
    setSelectedProductId("");
  }

  function handleRemoveProduct(productId: string) {
    setValues((current) => ({
      ...current,
      items: removeBundleItem(current.items, productId),
    }));
  }

  function handleUnitsChange(productId: string, units: number) {
    setValues((current) => ({
      ...current,
      items: setBundleItemUnits(current.items, productId, units),
    }));
  }

  const canSubmit =
    !submitting && values.items.length > 0 && values.containerId.length > 0;

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
        className="flex flex-col gap-6"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Información general */}
          <section className={cardClass}>
            <SectionHeader
              icon={<Info className="h-5 w-5" />}
              title={labels.sectionGeneral}
            />
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="name">
                {labels.name}
              </label>
              <input
                id="name"
                name="name"
                required
                value={values.name}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder={labels.namePlaceholder}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className={labelClass} htmlFor="description">
                {labels.description}
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={values.description}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder={labels.descriptionPlaceholder}
                className={cn(fieldClass, "min-h-[110px] flex-1 resize-none")}
              />
            </div>
          </section>

          {/* Imagen de portada */}
          <section className={cardClass}>
            <SectionHeader
              icon={<ImageIcon className="h-5 w-5" />}
              title={labels.sectionImage}
            />
            <div className="border-outline-variant/60 bg-surface-container-high relative aspect-video w-full overflow-hidden rounded-xl border">
              {isValidImageUrl(values.imageUrl) ? (
                <Image
                  src={values.imageUrl}
                  alt={labels.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover"
                />
              ) : (
                <div className="text-on-surface-variant/50 flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                  <span className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
                    <Gift className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="font-label text-label-bold text-primary">
                    {labels.imageEmptyTitle}
                  </span>
                  <span className="text-xs">{labels.imageEmptyHint}</span>
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
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    imageUrl: event.target.value,
                  }))
                }
                placeholder={labels.imageUrlPlaceholder}
                className={fieldClass}
              />
            </div>
          </section>

          {/* Composición */}
          <section className={cn(cardClass, "lg:col-span-2")}>
            <div className="flex items-center justify-between">
              <SectionHeader
                icon={<Package className="h-5 w-5" />}
                title={labels.sectionComposition}
              />
              <span className="bg-secondary-container text-on-secondary-container font-label text-label-bold rounded-full px-2.5 py-0.5 text-[11px]">
                {labels.formatCompositionCount(values.items.length)}
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                aria-label={labels.productSelectPlaceholder}
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className={cn(fieldClass, "cursor-pointer appearance-none")}
              >
                <option value="">{labels.productSelectPlaceholder}</option>
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {formatPrice(product.unitNetPrice)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddProduct}
                disabled={!selectedProductId}
                className="border-secondary/40 text-secondary hover:bg-secondary/5 press-down font-label text-label-bold inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-3 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-5 w-5" aria-hidden />
                {labels.addProduct}
              </button>
            </div>

            {values.items.length === 0 ? (
              <p className="border-outline-variant/30 text-on-surface-variant font-body text-body-md rounded-xl border border-dashed px-4 py-6 text-center">
                {labels.emptyItems}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {values.items.map((item) => {
                  const product = productById.get(item.productId);
                  return (
                    <li
                      key={item.productId}
                      className="border-outline-variant/20 bg-surface-container-low flex flex-wrap items-center gap-3 rounded-xl border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-label text-label-bold text-on-surface truncate">
                          {product?.name ?? item.productId}
                        </p>
                        <p className="text-on-surface-variant/70 text-xs">
                          {labels.formatUnitPrice(
                            formatPrice(product?.unitNetPrice ?? 0),
                          )}
                        </p>
                      </div>
                      <UnitStepper
                        value={item.unitsPerPerson}
                        onDecrease={() =>
                          handleUnitsChange(
                            item.productId,
                            item.unitsPerPerson - 1,
                          )
                        }
                        onIncrease={() =>
                          handleUnitsChange(
                            item.productId,
                            item.unitsPerPerson + 1,
                          )
                        }
                        labels={labels}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(item.productId)}
                        aria-label={labels.removeProduct}
                        className="text-on-surface-variant hover:bg-error-container hover:text-error flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                      >
                        <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Configuración */}
          <section className={cardClass}>
            <SectionHeader
              icon={<Settings className="h-5 w-5" />}
              title={labels.sectionConfig}
            />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label text-label-bold text-on-surface">
                  {labels.configActiveTitle}
                </p>
                <p className="text-on-surface-variant/70 text-xs">
                  {labels.configActiveHint}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={values.isActive}
                aria-label={labels.configActiveTitle}
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    isActive: !current.isActive,
                  }))
                }
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
            <div className="bg-outline-variant/20 h-px w-full" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelClass} htmlFor="containerId">
                  {labels.container}
                </label>
                <select
                  id="containerId"
                  name="containerId"
                  required
                  value={values.containerId}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      containerId: event.target.value,
                    }))
                  }
                  className={cn(fieldClass, "cursor-pointer appearance-none")}
                >
                  <option value="">{labels.containerPlaceholder}</option>
                  {containers.map((container) => (
                    <option key={container.id} value={container.id}>
                      {container.name} · S/ {container.netPrice.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="quantity">
                  {labels.persons}
                </label>
                <div className="relative">
                  <Users
                    className="text-on-surface-variant pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
                    aria-hidden
                  />
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={values.quantity}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        quantity: Math.max(
                          1,
                          Math.floor(Number(event.target.value) || 1),
                        ),
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Resumen de precios */}
          <section
            className={cn(
              cardClass,
              "border-primary/20 bg-primary/5 justify-center",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-body text-body-md text-on-surface-variant">
                {labels.subtotalLabel}
              </span>
              <span className="font-label text-label-bold text-on-surface">
                {formatPrice(priceSummary.itemsSubtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-body-md text-on-surface-variant">
                {labels.containerLabel}
              </span>
              <span className="font-label text-label-bold text-on-surface">
                {formatPrice(priceSummary.containerSubtotal)}
              </span>
            </div>
            <p className="text-on-surface-variant/70 text-xs">
              S/ {selectedContainerPrice.toFixed(2)} × {values.quantity}{" "}
              sorpresas
            </p>
            <div className="bg-primary/20 h-px w-full" />
            <div className="flex items-center justify-between">
              <span className="font-label text-label-bold text-primary uppercase">
                {labels.totalLabel}
              </span>
              <span className="font-display text-price-display text-primary">
                {formatPrice(priceSummary.total)}
              </span>
            </div>
          </section>
        </div>

        {/* Barra de acciones */}
        <div className="border-outline-variant/10 bg-surface/95 px-margin-mobile fixed inset-x-0 bottom-0 z-30 border-t pb-8 pt-4 backdrop-blur-xl lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-4 sm:justify-start lg:hidden">
              <span className="font-label text-label-bold text-on-surface-variant text-xs uppercase">
                {labels.totalLabel}
              </span>
              <span className="font-display text-price-display text-primary">
                {formatPrice(priceSummary.total)}
              </span>
            </div>
            {error ? (
              <p className="text-error font-body text-body-md sm:mr-auto">
                {error}
              </p>
            ) : null}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="border-secondary text-secondary hover:bg-secondary/5 press-down font-label text-label-bold min-h-12 flex-1 rounded-full border-2 px-8 py-3 transition-colors sm:flex-none"
              >
                {labels.cancel}
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="bg-primary text-on-primary hover:bg-primary-container press-down font-label text-label-bold shadow-primary/20 inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-8 py-3 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                <Save className="h-5 w-5" aria-hidden />
                {submitting ? labels.saving : labels.save}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
