"use client";

import Link from "next/link";
import { FolderTree, Pencil, Trash2 } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { CategoryListItem } from "@de-tin-marin/validations/category";
import type {
  CategoryListLabels,
  CategoryListProps,
} from "./category-list.types";

const ICON_STYLES = [
  "bg-primary-container/40 text-on-primary-container",
  "bg-secondary-container/60 text-on-secondary-container",
  "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  "bg-surface-container-highest text-on-surface-variant",
];

function categoryIconClass(name: string): string {
  const sum = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ICON_STYLES[sum % ICON_STYLES.length] ?? "";
}

function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className: string;
}) {
  return (
    <div
      className={cn(
        "border-outline-variant/20 flex items-center justify-center border",
        categoryIconClass(name),
        className,
      )}
      aria-hidden
    >
      <FolderTree className="h-6 w-6" />
    </div>
  );
}

function StatusBadge({
  active,
  labels,
}: {
  active: boolean;
  labels: CategoryListLabels;
}) {
  return (
    <span
      className={cn(
        "font-label text-label-bold rounded-full px-3 py-1 text-[11px] uppercase",
        active
          ? "bg-secondary-container text-on-secondary-container"
          : "bg-surface-container-highest text-on-surface-variant opacity-70",
      )}
    >
      {active ? labels.statusActive : labels.statusInactive}
    </span>
  );
}

function CategoryActions({
  category,
  onDelete,
  deleting,
  labels,
  variant,
}: {
  category: CategoryListItem;
  onDelete: (id: string) => void;
  deleting: boolean;
  labels: CategoryListLabels;
  variant: "table" | "card";
}) {
  if (variant === "card") {
    return (
      <div className="mt-3 flex gap-4">
        <Link
          href={`/categories/${category.id}/edit`}
          aria-label={labels.formatAriaEdit(category.name)}
          className="text-primary font-label text-label-bold flex items-center gap-1 transition-transform active:scale-95"
        >
          <Pencil className="h-[18px] w-[18px]" aria-hidden />
          {labels.edit}
        </Link>
        <button
          type="button"
          aria-label={labels.formatAriaDelete(category.name)}
          disabled={deleting}
          onClick={() => onDelete(category.id)}
          className="text-error font-label text-label-bold flex items-center gap-1 transition-transform active:scale-95 disabled:opacity-60"
        >
          <Trash2 className="h-[18px] w-[18px]" aria-hidden />
          {labels.delete}
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/categories/${category.id}/edit`}
        aria-label={labels.formatAriaEdit(category.name)}
        className="text-on-surface-variant hover:bg-primary-container/10 hover:text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </Link>
      <button
        type="button"
        aria-label={labels.formatAriaDelete(category.name)}
        disabled={deleting}
        onClick={() => onDelete(category.id)}
        className="text-on-surface-variant hover:bg-error-container/10 hover:text-error flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function EmptyState({
  hasCategories,
  labels,
}: {
  hasCategories: boolean;
  labels: CategoryListLabels;
}) {
  return (
    <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl border p-12 text-center">
      <p className="font-body text-body-md text-on-surface-variant">
        {hasCategories ? labels.emptyFiltered : labels.empty}
      </p>
    </div>
  );
}

export function CategoryList({
  categories,
  totalCount,
  labels,
  onDelete,
  deletingId,
}: CategoryListProps) {
  if (categories.length === 0) {
    return <EmptyState hasCategories={totalCount > 0} labels={labels} />;
  }

  return (
    <>
      {/* Desktop: tabla */}
      <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl hidden overflow-hidden border shadow-xl lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low border-outline-variant/20 border-b">
              {[
                labels.columns.image,
                labels.columns.name,
                labels.columns.slug,
                labels.columns.order,
                labels.columns.status,
              ].map((label) => (
                <th
                  key={label}
                  className="font-label text-label-bold text-on-surface-variant px-6 py-5 uppercase"
                >
                  {label}
                </th>
              ))}
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5 text-right uppercase">
                {labels.columns.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-outline-variant/10 divide-y">
            {categories.map((category) => (
              <tr
                key={category.id}
                className={cn(
                  "hover:bg-surface-bright group transition-colors",
                  !category.isActive && "opacity-75",
                )}
              >
                <td className="px-6 py-5">
                  <CategoryIcon
                    name={category.name}
                    className="h-12 w-12 rounded-xl transition-transform group-hover:scale-110"
                  />
                </td>
                <td className="px-6 py-5">
                  <p className="font-label text-body-md text-on-surface font-bold">
                    {category.name}
                  </p>
                  {category.description ? (
                    <p className="text-on-surface-variant/60 line-clamp-1 text-xs">
                      {category.description}
                    </p>
                  ) : null}
                </td>
                <td className="text-on-surface-variant px-6 py-5 font-mono text-sm">
                  {labels.slugPrefix}
                  {category.slug}
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="bg-surface-container text-on-surface-variant font-label text-label-bold inline-flex h-8 w-8 items-center justify-center rounded-lg">
                    {category.sortOrder}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <StatusBadge active={category.isActive} labels={labels} />
                </td>
                <td className="px-6 py-5 text-right">
                  <CategoryActions
                    category={category}
                    onDelete={onDelete}
                    deleting={deletingId === category.id}
                    labels={labels}
                    variant="table"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-surface-container-low border-outline-variant/10 border-t px-6 py-4">
          <p className="font-label text-label-bold text-on-surface-variant text-xs">
            {labels.formatPagination(categories.length, totalCount)}
          </p>
        </div>
      </div>

      {/* Móvil: tarjetas */}
      <div className="flex flex-col gap-4 lg:hidden">
        {categories.map((category) => (
          <article
            key={category.id}
            className={cn(
              "border-outline-variant/10 bg-surface-container-lowest soft-glow-pink flex gap-4 rounded-xl border p-4",
              !category.isActive && "opacity-75",
            )}
          >
            <CategoryIcon
              name={category.name}
              className="h-20 w-20 shrink-0 rounded-lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <span className="font-label text-secondary text-[12px] font-bold uppercase tracking-wider">
                  {labels.formatOrder(category.sortOrder)}
                </span>
                <StatusBadge active={category.isActive} labels={labels} />
              </div>
              <h3 className="font-display text-headline-md text-on-surface mt-1 font-bold leading-tight">
                {category.name}
              </h3>
              <p className="text-on-surface-variant mt-1 truncate text-sm italic">
                {labels.formatSlug(category.slug)}
              </p>
              <CategoryActions
                category={category}
                onDelete={onDelete}
                deleting={deletingId === category.id}
                labels={labels}
                variant="card"
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
