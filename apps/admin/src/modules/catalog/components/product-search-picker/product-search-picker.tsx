"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Candy, Search } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import { shouldShowItemsPerPackage } from "./product-search-picker.helpers";
import type {
  ProductSearchPickerItem,
  ProductSearchPickerProps,
} from "./product-search-picker.types";

function defaultFormatPrice(price: number): string {
  return `S/ ${price.toFixed(2)}`;
}

function ProductThumb({ url, name }: { url: string | null; name: string }) {
  if (!url) {
    return (
      <div
        className="bg-surface-container text-on-surface-variant/50 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        aria-hidden
      >
        <Candy className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="bg-surface-container relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
      <Image src={url} alt={name} fill sizes="44px" className="object-cover" />
    </div>
  );
}

function ProductMeta({
  item,
  labels,
  formatPrice,
}: {
  item: ProductSearchPickerItem;
  labels: ProductSearchPickerProps["labels"];
  formatPrice: (price: number) => string;
}) {
  const unitPriceLabel = labels.formatUnitPrice(formatPrice(item.unitNetPrice));
  const showPresentation = shouldShowItemsPerPackage(item);

  return (
    <p className="text-on-surface-variant mt-0.5 truncate text-xs">
      <span className="text-primary font-medium tabular-nums">
        {formatPrice(item.netPrice)}
      </span>
      <span className="text-on-surface-variant/40 mx-1.5" aria-hidden>
        ·
      </span>
      <span className="tabular-nums">{unitPriceLabel}</span>
      {showPresentation ? (
        <>
          <span className="text-on-surface-variant/40 mx-1.5" aria-hidden>
            ·
          </span>
          <span>{labels.formatItemsPerPackage(item.itemsPerPackage)}</span>
        </>
      ) : null}
    </p>
  );
}

export function ProductSearchPicker({
  items,
  excludeIds,
  searchValue,
  isLoading,
  isError,
  canLoadMore,
  labels,
  onSearchChange,
  onSelect,
  onLoadMore,
  formatPrice = defaultFormatPrice,
}: ProductSearchPickerProps) {
  const exclude = new Set(excludeIds);
  const visible = items.filter((item) => !exclude.has(item.id));
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const node = sentinelRef.current;
    const root = listRef.current;
    if (!node || !root || !canLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current();
        }
      },
      { root, rootMargin: "48px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, visible.length]);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="relative">
        <Search
          className="text-on-surface-variant pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          aria-hidden
        />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchAriaLabel}
          className="border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary font-body h-11 w-full rounded-xl border-2 pl-10 pr-3 text-sm outline-none"
        />
      </div>

      <div
        ref={listRef}
        className="border-outline-variant/20 bg-surface-container-lowest max-h-64 overflow-y-auto rounded-xl border"
        role="listbox"
      >
        {isLoading && visible.length === 0 ? (
          <p className="font-body text-on-surface-variant p-3 text-sm">
            {labels.loading}
          </p>
        ) : isError ? (
          <p className="font-body text-error p-3 text-sm">{labels.empty}</p>
        ) : visible.length === 0 ? (
          <p className="font-body text-on-surface-variant p-3 text-sm">
            {labels.empty}
          </p>
        ) : (
          <ul className="divide-outline-variant/15 divide-y">
            {visible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className={cn(
                    "hover:bg-secondary/5 font-body text-on-surface flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  )}
                  onClick={() => onSelect(item)}
                >
                  <ProductThumb url={item.imageUrl} name={item.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {item.name}
                    </span>
                    <ProductMeta
                      item={item}
                      labels={labels}
                      formatPrice={formatPrice}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
        {isLoading && visible.length > 0 ? (
          <p className="font-body text-on-surface-variant px-3 py-2 text-center text-xs">
            {labels.loading}
          </p>
        ) : null}
      </div>
    </div>
  );
}
