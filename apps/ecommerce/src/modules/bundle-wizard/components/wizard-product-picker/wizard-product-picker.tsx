"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Search } from "lucide-react";
import type { PublicProductListItem } from "@de-tin-marin/validations/public-catalog";
import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";
import { formatPrice } from "@/modules/home/components/product-card/product-card.helpers";

export type WizardProductPickerProps = {
  searchValue: string;
  products: PublicProductListItem[];
  selectedProductIds: Set<string>;
  labels: {
    title: string;
    searchPlaceholder: string;
    searchAriaLabel: string;
    add: string;
    empty: string;
    maxReached: string;
    alreadyAdded: string;
    loading: string;
    error: string;
    retry: string;
    expand: string;
    collapse: string;
  };
  canAdd: boolean;
  isLoading: boolean;
  isError: boolean;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onRetry: () => void;
  onAdd: (product: PublicProductListItem) => void;
};

export function WizardProductPicker({
  searchValue,
  products,
  selectedProductIds,
  labels,
  canAdd,
  isLoading,
  isError,
  onSearchChange,
  onSearchSubmit,
  onRetry,
  onAdd,
}: WizardProductPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="border-outline-variant/30 bg-surface-container-lowest soft-glow-pink rounded-3xl border p-4 md:p-5">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <h2 className="font-label text-label-bold text-on-surface">
          {labels.title}
        </h2>
        <span className="text-on-surface-variant inline-flex items-center gap-1">
          <span className="font-body text-body-sm hidden sm:inline">
            {isExpanded ? labels.collapse : labels.expand}
          </span>
          <ChevronDown
            className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </span>
      </button>

      {isExpanded ? (
        <div className="mt-4 space-y-4">
          {!canAdd ? (
            <p
              role="status"
              className="font-body text-body-sm text-on-surface-variant bg-surface-container rounded-2xl px-4 py-3"
            >
              {labels.maxReached}
            </p>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit();
            }}
          >
            <div className="relative">
              <Search
                className="text-on-surface-variant pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                aria-hidden
              />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={labels.searchPlaceholder}
                aria-label={labels.searchAriaLabel}
                disabled={!canAdd}
                className="font-body text-body-md text-on-surface border-outline-variant/40 focus:border-secondary focus:ring-secondary/20 bg-surface-container-lowest w-full rounded-full border-2 py-3 pl-12 pr-4 shadow-sm outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </form>

          {isLoading ? (
            <p
              role="status"
              className="font-body text-body-md text-on-surface-variant py-4 text-center"
            >
              {labels.loading}
            </p>
          ) : null}

          {isError ? (
            <div className="py-4 text-center">
              <p className="font-body text-body-md text-error mb-3">
                {labels.error}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="press-down bg-primary text-on-primary font-label text-label-bold rounded-full px-6 py-2"
              >
                {labels.retry}
              </button>
            </div>
          ) : null}

          {!isLoading && !isError && products.length === 0 ? (
            <p className="font-body text-body-md text-on-surface-variant py-4 text-center">
              {labels.empty}
            </p>
          ) : null}

          {!isLoading && !isError && products.length > 0 ? (
            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {products.map((product) => {
                const isSelected = selectedProductIds.has(product.id);
                const disabled = !canAdd || isSelected;

                return (
                  <li
                    key={product.id}
                    className="border-outline-variant/30 bg-surface-container-low flex items-center gap-3 rounded-2xl border px-3 py-2.5"
                  >
                    <div className="bg-surface-container-lowest relative h-14 w-14 shrink-0 overflow-hidden rounded-xl shadow-sm">
                      <Image
                        src={product.imageUrl ?? CATALOG_PLACEHOLDER_IMAGE}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-label text-label-bold text-on-surface truncate">
                        {product.name}
                      </p>
                      <p className="font-body text-body-sm text-on-surface-variant truncate">
                        {product.categoryName}
                      </p>
                      <p className="font-label text-label-bold text-primary">
                        {formatPrice(product.finalPrice)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onAdd(product)}
                      className={
                        isSelected
                          ? "font-label text-label-bold text-on-surface-variant bg-surface-container shrink-0 cursor-not-allowed rounded-full px-4 py-2"
                          : "press-down border-primary text-primary font-label text-label-bold hover:bg-primary-container shrink-0 rounded-full border-2 bg-transparent px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      }
                    >
                      {isSelected ? labels.alreadyAdded : labels.add}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
