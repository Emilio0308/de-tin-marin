"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ChevronRight,
  ImageIcon,
  Info,
  Minus,
  Package,
  Plus,
  Save,
  Settings,
  Tag,
  Trash2,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import { GranularNumberInput } from "@/shared/forms/granular-number-input";
import { SHOW_INCLUDE_INACTIVE_PRODUCTS_SWITCH } from "@/modules/catalog/lib/include-inactive-products-switch";
import { ProductSearchPickerContainer } from "@/modules/catalog/components/product-search-picker/product-search-picker.container";
import {
  addPackItem,
  buildDefaultPackValues,
  canSubmitPackForm,
  computeLiveFinalPrice,
  computeLiveReference,
  isAllowedCatalogImageFile,
  isValidImageUrl,
  removePackItem,
  setPackItemPackageQuantity,
  setPackItemUnitQuantity,
} from "./pack-form.helpers";
import type { PackFormProps } from "./pack-form.types";

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

function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="bg-surface-container-high flex items-center gap-3 rounded-full p-1">
      <button
        type="button"
        onClick={onDecrease}
        aria-label={decreaseLabel}
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
        aria-label={increaseLabel}
        className="press-down bg-secondary flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm"
      >
        <Plus className="h-[18px] w-[18px]" aria-hidden />
      </button>
    </div>
  );
}

export function PackForm({
  initial,
  products,
  campaigns,
  labels,
  includeInactiveProducts,
  onIncludeInactiveProductsChange,
  onEnsureProductOption,
  productStatus,
  onSubmit,
  onCancel,
  submitting,
  error,
}: PackFormProps) {
  const [values, setValues] = useState(() => buildDefaultPackValues(initial));
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  function handleImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageError(null);

    if (!isAllowedCatalogImageFile(file)) {
      setImageError(labels.imageFileInvalid);
      return;
    }

    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    const objectUrl = URL.createObjectURL(file);
    setPreviewObjectUrl(objectUrl);
    setPendingImage(file);
    setValues((current) => ({ ...current, imageUrl: objectUrl }));
  }

  function clearImage() {
    setImageError(null);
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    setPreviewObjectUrl(null);
    setPendingImage(null);
    setValues((current) => ({ ...current, imageUrl: "" }));
  }

  const availableExcludeIds = useMemo(
    () => values.items.map((item) => item.productId),
    [values.items],
  );

  const referenceNetPrice = useMemo(
    () => computeLiveReference(values, products),
    [values, products],
  );

  const finalPrice = useMemo(
    () =>
      computeLiveFinalPrice(
        values.normalNetPrice,
        values.campaignId,
        campaigns,
      ),
    [values.normalNetPrice, values.campaignId, campaigns],
  );

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const priceValid = values.normalNetPrice >= referenceNetPrice;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await onSubmit(values, pendingImage);
    } catch {
      // El container maneja errores.
    }
  }

  function handlePickProduct(item: {
    id: string;
    name: string;
    netPrice: number;
    unitNetPrice: number;
  }) {
    onEnsureProductOption({
      id: item.id,
      name: item.name,
      packageNetPrice: item.netPrice,
      unitNetPrice: item.unitNetPrice,
    });
    setValues((current) => ({
      ...current,
      items: addPackItem(current.items, item.id),
    }));
  }

  function handleRemoveProduct(productId: string) {
    setValues((current) => ({
      ...current,
      items: removePackItem(current.items, productId),
    }));
  }

  function handlePackageQuantityChange(productId: string, quantity: number) {
    setValues((current) => ({
      ...current,
      items: setPackItemPackageQuantity(current.items, productId, quantity),
    }));
  }

  function handleUnitQuantityChange(productId: string, quantity: number) {
    setValues((current) => ({
      ...current,
      items: setPackItemUnitQuantity(current.items, productId, quantity),
    }));
  }

  const canSubmit =
    !submitting &&
    canSubmitPackForm(values) &&
    priceValid &&
    values.normalNetPrice > 0;

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
          <section className={cardClass}>
            <SectionHeader
              icon={<Info className="h-5 w-5" />}
              title={labels.sectionGeneral}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="sku">
                  {labels.sku}
                </label>
                <input
                  id="sku"
                  name="sku"
                  required
                  value={values.sku}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      sku: event.target.value,
                    }))
                  }
                  placeholder={labels.skuPlaceholder}
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="slug">
                  {labels.slug}
                </label>
                <input
                  id="slug"
                  name="slug"
                  value={values.slug}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      slug: event.target.value,
                    }))
                  }
                  placeholder={labels.slugPlaceholder}
                  className={fieldClass}
                />
              </div>
            </div>
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

          <section className={cardClass}>
            <SectionHeader
              icon={<ImageIcon className="h-5 w-5" />}
              title={labels.sectionImage}
            />
            <div className="border-outline-variant/60 bg-surface-container-high relative aspect-video w-full overflow-hidden rounded-xl border">
              {isValidImageUrl(values.imageUrl) ? (
                values.imageUrl.startsWith("blob:") ? (
                  // Local preview before save — next/image does not optimize blob URLs.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={values.imageUrl}
                    alt={labels.imageAlt}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={values.imageUrl}
                    alt={labels.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover"
                  />
                )
              ) : (
                <div className="text-on-surface-variant/50 flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                  <span className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
                    <Package className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="font-label text-label-bold text-primary">
                    {labels.imageEmptyTitle}
                  </span>
                  <span className="text-xs">{labels.imageEmptyHint}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="packImageFile">
                {labels.imageUpload}
              </label>
              <input
                id="packImageFile"
                name="packImageFile"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                disabled={submitting}
                onChange={handleImageFileChange}
                className="font-body text-body-sm text-on-surface file:bg-primary file:text-on-primary file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-sm"
              />
              {submitting && pendingImage ? (
                <p className="font-body text-body-sm text-on-surface-variant">
                  {labels.imageUploading}
                </p>
              ) : null}
              {imageError ? (
                <p className="font-body text-body-sm text-error" role="alert">
                  {imageError}
                </p>
              ) : null}
              {isValidImageUrl(values.imageUrl) ? (
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={submitting}
                  className="text-on-surface-variant hover:text-error font-label text-label-bold self-start text-xs uppercase tracking-wide"
                >
                  {labels.imageClear}
                </button>
              ) : null}
            </div>
          </section>

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

            {SHOW_INCLUDE_INACTIVE_PRODUCTS_SWITCH ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-label text-label-bold text-on-surface">
                    {labels.includeInactiveProducts}
                  </p>
                  <p className="text-on-surface-variant/70 text-xs">
                    {labels.includeInactiveProductsHint}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={includeInactiveProducts}
                  aria-label={labels.includeInactiveProducts}
                  onClick={() =>
                    onIncludeInactiveProductsChange(!includeInactiveProducts)
                  }
                  className={cn(
                    "inline-flex h-7 w-14 shrink-0 items-center rounded-full px-0.5 transition-colors duration-200",
                    includeInactiveProducts
                      ? "bg-primary"
                      : "bg-surface-container-highest",
                  )}
                >
                  <span
                    className={cn(
                      "h-6 w-6 rounded-full bg-white shadow transition-transform duration-200",
                      includeInactiveProducts
                        ? "translate-x-7"
                        : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            ) : null}

            <ProductSearchPickerContainer
              status={productStatus}
              excludeIds={availableExcludeIds}
              onSelect={handlePickProduct}
              formatPrice={formatPrice}
              labels={{
                searchPlaceholder: labels.productSelectPlaceholder,
                searchAriaLabel: labels.productSelectPlaceholder,
              }}
            />

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
                          {labels.formatPackagePrice(
                            formatPrice(product?.packageNetPrice ?? 0),
                          )}{" "}
                          ·{" "}
                          {labels.formatUnitPrice(
                            formatPrice(product?.unitNetPrice ?? 0),
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-on-surface-variant/70 text-[10px] uppercase tracking-wide">
                            {labels.packagesLabel}
                          </span>
                          <QuantityStepper
                            value={item.packageQuantity}
                            onDecrease={() =>
                              handlePackageQuantityChange(
                                item.productId,
                                item.packageQuantity - 1,
                              )
                            }
                            onIncrease={() =>
                              handlePackageQuantityChange(
                                item.productId,
                                item.packageQuantity + 1,
                              )
                            }
                            decreaseLabel={labels.decreasePackages}
                            increaseLabel={labels.increasePackages}
                          />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-on-surface-variant/70 text-[10px] uppercase tracking-wide">
                            {labels.unitsLabel}
                          </span>
                          <QuantityStepper
                            value={item.unitQuantity}
                            onDecrease={() =>
                              handleUnitQuantityChange(
                                item.productId,
                                item.unitQuantity - 1,
                              )
                            }
                            onIncrease={() =>
                              handleUnitQuantityChange(
                                item.productId,
                                item.unitQuantity + 1,
                              )
                            }
                            decreaseLabel={labels.decreaseUnits}
                            increaseLabel={labels.increaseUnits}
                          />
                        </div>
                      </div>
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

          <section className={cardClass}>
            <SectionHeader
              icon={<Tag className="h-5 w-5" />}
              title={labels.sectionPricing}
            />
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="referencePrice">
                {labels.referencePrice}
              </label>
              <input
                id="referencePrice"
                readOnly
                value={formatPrice(referenceNetPrice)}
                className={cn(fieldClass, "bg-surface-container-high")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="normalNetPrice">
                {labels.normalPrice}
              </label>
              <GranularNumberInput
                id="normalNetPrice"
                name="normalNetPrice"
                mode="decimal"
                min={0}
                emptyFallback={0}
                required
                value={values.normalNetPrice}
                onValueChange={(next) =>
                  setValues((current) => ({
                    ...current,
                    normalNetPrice: next ?? 0,
                  }))
                }
                className={cn(
                  fieldClass,
                  !priceValid && "border-error focus:border-error",
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="finalPrice">
                {labels.finalPrice}
              </label>
              <input
                id="finalPrice"
                readOnly
                value={formatPrice(finalPrice)}
                className={cn(fieldClass, "bg-surface-container-high")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="campaignId">
                {labels.campaign}
              </label>
              <select
                id="campaignId"
                name="campaignId"
                value={values.campaignId}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    campaignId: event.target.value,
                  }))
                }
                className={cn(fieldClass, "cursor-pointer appearance-none")}
              >
                <option value="">{labels.campaignNone}</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} (−{campaign.percentage}%)
                  </option>
                ))}
              </select>
            </div>
          </section>

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
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="purchaseMinQuantity">
                  {labels.purchaseMin}
                </label>
                <GranularNumberInput
                  id="purchaseMinQuantity"
                  name="purchaseMinQuantity"
                  mode="integer"
                  min={1}
                  emptyFallback={1}
                  required
                  value={values.purchaseMinQuantity}
                  onValueChange={(next) =>
                    setValues((current) => ({
                      ...current,
                      purchaseMinQuantity: next ?? 1,
                    }))
                  }
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="purchaseMaxQuantity">
                  {labels.purchaseMax}
                </label>
                <GranularNumberInput
                  id="purchaseMaxQuantity"
                  name="purchaseMaxQuantity"
                  mode="integer"
                  min={1}
                  emptyFallback={1}
                  required
                  value={values.purchaseMaxQuantity}
                  onValueChange={(next) =>
                    setValues((current) => ({
                      ...current,
                      purchaseMaxQuantity: next ?? 1,
                    }))
                  }
                  className={fieldClass}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="border-outline-variant/10 bg-surface/95 px-margin-mobile fixed inset-x-0 bottom-0 z-30 border-t pb-8 pt-4 backdrop-blur-xl lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-4 sm:justify-start lg:hidden">
              <span className="font-label text-label-bold text-on-surface-variant text-xs uppercase">
                {labels.finalPrice}
              </span>
              <span className="font-display text-price-display text-primary">
                {formatPrice(finalPrice)}
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
