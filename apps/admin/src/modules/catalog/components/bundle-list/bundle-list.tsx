"use client";

import Image from "next/image";
import Link from "next/link";
import { Gift, Pencil, Trash2, Users } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { BundleListItem } from "@de-tin-marin/validations/bundle";
import type { BundleListLabels, BundleListProps } from "./bundle-list.types";

function formatPrice(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

function BundleThumb({
  url,
  name,
  className,
}: {
  url: string | null;
  name: string;
  className: string;
}) {
  if (!url) {
    return (
      <div
        className={cn(
          "bg-primary-container/40 text-on-primary-container/60 flex items-center justify-center",
          className,
        )}
        aria-hidden
      >
        <Gift className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div
      className={cn("bg-surface-container relative overflow-hidden", className)}
    >
      <Image src={url} alt={name} fill sizes="80px" className="object-cover" />
    </div>
  );
}

function StatusBadge({
  active,
  labels,
}: {
  active: boolean;
  labels: BundleListLabels;
}) {
  return (
    <span
      className={cn(
        "font-label text-label-bold inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs",
        active
          ? "bg-secondary-container text-on-secondary-container"
          : "bg-surface-container-high text-on-surface-variant",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-secondary" : "bg-outline",
        )}
      />
      {active ? labels.statusActive : labels.statusDraft}
    </span>
  );
}

function BundleActions({
  bundle,
  onDelete,
  deleting,
  labels,
}: {
  bundle: BundleListItem;
  onDelete: (id: string) => void;
  deleting: boolean;
  labels: BundleListLabels;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/bundles/${bundle.id}/edit`}
        aria-label={labels.formatAriaEdit(bundle.name)}
        className="text-on-surface-variant hover:bg-surface-container-high hover:text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </Link>
      <button
        type="button"
        aria-label={labels.formatAriaDelete(bundle.name)}
        disabled={deleting}
        onClick={() => onDelete(bundle.id)}
        className="text-on-surface-variant hover:bg-error-container hover:text-error flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function EmptyState({
  hasBundles,
  labels,
}: {
  hasBundles: boolean;
  labels: BundleListLabels;
}) {
  return (
    <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl border p-12 text-center">
      <p className="font-body text-body-md text-on-surface-variant">
        {hasBundles ? labels.emptyFiltered : labels.empty}
      </p>
    </div>
  );
}

export function BundleList({
  bundles,
  totalCount,
  labels,
  onDelete,
  deletingId,
}: BundleListProps) {
  if (bundles.length === 0) {
    return <EmptyState hasBundles={totalCount > 0} labels={labels} />;
  }

  return (
    <>
      {/* Desktop: tabla de sorpresas */}
      <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl hidden overflow-hidden border shadow-xl lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low border-outline-variant/20 border-b">
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5">
                {labels.columns.bundle}
              </th>
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5">
                {labels.columns.price}
              </th>
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5 text-center">
                {labels.columns.persons}
              </th>
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5">
                {labels.columns.status}
              </th>
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5 text-right">
                {labels.columns.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-outline-variant/10 divide-y">
            {bundles.map((bundle) => (
              <tr
                key={bundle.id}
                className="hover:bg-surface-bright group transition-colors"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <BundleThumb
                      url={bundle.imageUrl}
                      name={bundle.name}
                      className="border-outline-variant/20 h-12 w-12 rounded-2xl border transition-transform group-hover:scale-110"
                    />
                    <div>
                      <p className="font-display text-on-surface text-base font-bold">
                        {bundle.name}
                      </p>
                      <p className="text-on-surface-variant/60 text-xs">
                        {labels.formatItemCount(bundle.itemCount)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="font-display text-primary block text-lg font-extrabold">
                    {formatPrice(bundle.total)}
                  </span>
                  <span className="text-on-surface-variant/60 text-xs">
                    {labels.containerShort}:{" "}
                    {formatPrice(bundle.containerNetPrice)} ·{" "}
                    {bundle.containerName}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="bg-surface-container-high text-on-surface font-label text-label-bold inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {bundle.quantity}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <StatusBadge active={bundle.isActive} labels={labels} />
                </td>
                <td className="px-6 py-5 text-right">
                  <BundleActions
                    bundle={bundle}
                    onDelete={onDelete}
                    deleting={deletingId === bundle.id}
                    labels={labels}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-surface-container-low border-outline-variant/10 border-t px-6 py-4">
          <p className="font-label text-label-bold text-on-surface-variant text-xs">
            {labels.formatPagination(bundles.length, totalCount)}
          </p>
        </div>
      </div>

      {/* Móvil: tarjetas de sorpresa */}
      <div className="flex flex-col gap-4 lg:hidden">
        {bundles.map((bundle) => (
          <article
            key={bundle.id}
            className="border-outline-variant/10 bg-surface-container-lowest flex flex-col gap-3 rounded-2xl border p-4 shadow-sm"
          >
            <div className="flex gap-4">
              <BundleThumb
                url={bundle.imageUrl}
                name={bundle.name}
                className="h-20 w-20 shrink-0 rounded-xl"
              />
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-body-md text-on-surface font-bold leading-tight">
                    {bundle.name}
                  </h3>
                  <StatusBadge active={bundle.isActive} labels={labels} />
                </div>
                <div className="text-on-surface-variant/70 mt-1 flex items-center gap-3 text-xs">
                  <span>{labels.formatItemCount(bundle.itemCount)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {labels.formatPersons(bundle.quantity)}
                  </span>
                </div>
                <span className="font-display text-primary mt-2 text-[20px] font-extrabold">
                  {formatPrice(bundle.total)}
                </span>
              </div>
            </div>
            <div className="bg-outline-variant/10 h-px w-full" />
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant/60 font-label text-label-bold text-xs">
                {labels.containerShort}: {formatPrice(bundle.containerNetPrice)}{" "}
                · {bundle.containerName}
              </span>
              <div className="flex items-center gap-1">
                <Link
                  href={`/bundles/${bundle.id}/edit`}
                  aria-label={labels.formatAriaEdit(bundle.name)}
                  className="text-primary font-label text-label-bold hover:bg-primary/5 flex items-center gap-1 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {labels.edit}
                  <Pencil className="h-[18px] w-[18px]" aria-hidden />
                </Link>
                <button
                  type="button"
                  aria-label={labels.formatAriaDelete(bundle.name)}
                  disabled={deletingId === bundle.id}
                  onClick={() => onDelete(bundle.id)}
                  className="text-on-surface-variant hover:bg-error-container hover:text-error flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
