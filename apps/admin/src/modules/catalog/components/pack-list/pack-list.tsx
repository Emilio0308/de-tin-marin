"use client";

import Image from "next/image";
import Link from "next/link";
import { Layers, Pencil, Trash2 } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { PackListItem } from "@de-tin-marin/validations/pack";
import type { PackListLabels, PackListProps } from "./pack-list.types";

function formatPrice(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

function PackThumb({
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
        <Layers className="h-6 w-6" />
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
  labels: PackListLabels;
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

function PackActions({
  pack,
  onDelete,
  deleting,
  labels,
}: {
  pack: PackListItem;
  onDelete: (id: string) => void;
  deleting: boolean;
  labels: PackListLabels;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/packs/${pack.id}/edit`}
        aria-label={labels.formatAriaEdit(pack.name)}
        className="text-on-surface-variant hover:bg-surface-container-high hover:text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </Link>
      <button
        type="button"
        aria-label={labels.formatAriaDelete(pack.name)}
        disabled={deleting}
        onClick={() => onDelete(pack.id)}
        className="text-on-surface-variant hover:bg-error-container hover:text-error flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function EmptyState({
  hasPacks,
  labels,
}: {
  hasPacks: boolean;
  labels: PackListLabels;
}) {
  return (
    <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl border p-12 text-center">
      <p className="font-body text-body-md text-on-surface-variant">
        {hasPacks ? labels.emptyFiltered : labels.empty}
      </p>
    </div>
  );
}

export function PackList({
  packs,
  totalCount,
  labels,
  onDelete,
  deletingId,
}: PackListProps) {
  if (packs.length === 0) {
    return <EmptyState hasPacks={totalCount > 0} labels={labels} />;
  }

  return (
    <>
      <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl hidden overflow-hidden border shadow-xl lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low border-outline-variant/20 border-b">
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5">
                {labels.columns.pack}
              </th>
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5">
                {labels.columns.price}
              </th>
              <th className="font-label text-label-bold text-on-surface-variant px-6 py-5">
                {labels.columns.reference}
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
            {packs.map((pack) => (
              <tr
                key={pack.id}
                className="hover:bg-surface-bright group transition-colors"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <PackThumb
                      url={pack.imageUrl}
                      name={pack.name}
                      className="border-outline-variant/20 h-12 w-12 rounded-2xl border transition-transform group-hover:scale-110"
                    />
                    <div>
                      <p className="font-display text-on-surface text-base font-bold">
                        {pack.name}
                      </p>
                      <p className="text-on-surface-variant/60 text-xs">
                        {pack.sku} · {labels.formatItemCount(pack.itemCount)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="font-display text-primary block text-lg font-extrabold">
                    {formatPrice(pack.finalPrice)}
                  </span>
                  {pack.campaign ? (
                    <span className="text-on-surface-variant/60 text-xs">
                      {labels.campaignShort}: {pack.campaign.name}
                    </span>
                  ) : null}
                </td>
                <td className="px-6 py-5">
                  <span className="font-label text-label-bold text-on-surface">
                    {formatPrice(pack.referencePrice)}
                  </span>
                  <span className="text-on-surface-variant/60 block text-xs">
                    {formatPrice(pack.normalPrice)} normal
                  </span>
                </td>
                <td className="px-6 py-5">
                  <StatusBadge active={pack.isActive} labels={labels} />
                </td>
                <td className="px-6 py-5 text-right">
                  <PackActions
                    pack={pack}
                    onDelete={onDelete}
                    deleting={deletingId === pack.id}
                    labels={labels}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-surface-container-low border-outline-variant/10 border-t px-6 py-4">
          <p className="font-label text-label-bold text-on-surface-variant text-xs">
            {labels.formatPagination(packs.length, totalCount)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:hidden">
        {packs.map((pack) => (
          <article
            key={pack.id}
            className="border-outline-variant/10 bg-surface-container-lowest flex flex-col gap-3 rounded-2xl border p-4 shadow-sm"
          >
            <div className="flex gap-4">
              <PackThumb
                url={pack.imageUrl}
                name={pack.name}
                className="h-20 w-20 shrink-0 rounded-xl"
              />
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-body-md text-on-surface font-bold leading-tight">
                    {pack.name}
                  </h3>
                  <StatusBadge active={pack.isActive} labels={labels} />
                </div>
                <p className="text-on-surface-variant/70 mt-1 text-xs">
                  {pack.sku} · {labels.formatItemCount(pack.itemCount)}
                </p>
                <span className="font-display text-primary mt-2 text-[20px] font-extrabold">
                  {formatPrice(pack.finalPrice)}
                </span>
              </div>
            </div>
            <div className="bg-outline-variant/10 h-px w-full" />
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant/60 font-label text-label-bold text-xs">
                Ref. {formatPrice(pack.referencePrice)}
              </span>
              <div className="flex items-center gap-1">
                <Link
                  href={`/packs/${pack.id}/edit`}
                  aria-label={labels.formatAriaEdit(pack.name)}
                  className="text-primary font-label text-label-bold hover:bg-primary/5 flex items-center gap-1 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {labels.edit}
                  <Pencil className="h-[18px] w-[18px]" aria-hidden />
                </Link>
                <button
                  type="button"
                  aria-label={labels.formatAriaDelete(pack.name)}
                  disabled={deletingId === pack.id}
                  onClick={() => onDelete(pack.id)}
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
