"use client";

import type { ReactNode } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import { GranularNumberInput } from "@/shared/forms/granular-number-input";
import { PickupPointMap } from "./pickup-point-map.dynamic";
import { PICKUP_POINT_NAME_MAX_LENGTH } from "./pickup-points.helpers";
import type { PickupPointsProps } from "./pickup-points.types";

const cardClass =
  "bg-surface-container-lowest border-outline-variant/40 flex flex-col gap-4 rounded-2xl border p-5 shadow-sm lg:p-8";
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

function StatusBadge({
  active,
  labels,
}: {
  active: boolean;
  labels: PickupPointsProps["labels"];
}) {
  return (
    <span
      className={cn(
        "font-label text-label-bold inline-flex rounded-full px-3 py-1 text-xs",
        active
          ? "bg-primary-fixed text-primary"
          : "bg-surface-container-high text-on-surface-variant",
      )}
    >
      {active ? labels.statusActive : labels.statusInactive}
    </span>
  );
}

export function PickupPoints({
  points,
  pointDraft,
  editingPoint,
  labels,
  pointSubmitting,
  deletingPointId,
  pointError,
  onPointDraftChange,
  onAddPoint,
  onStartEditPoint,
  onCancelEditPoint,
  onEditPointChange,
  onSaveEditPoint,
  onTogglePointActive,
  onDeletePoint,
  onMapPinChange,
}: PickupPointsProps) {
  const activeDraft = editingPoint ?? pointDraft;
  const mapPin = { lat: activeDraft.lat, lng: activeDraft.lng };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="space-y-2">
        <h1 className="font-display text-on-surface text-[32px] font-extrabold leading-10 tracking-tight lg:text-[40px]">
          {labels.title}
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant max-w-2xl">
          {labels.subtitle}
        </p>
      </header>

      <section className={cardClass}>
        <SectionHeader
          icon={<MapPin className="h-5 w-5" aria-hidden />}
          title={labels.sectionPoints}
        />

        <div className="space-y-4">
          <PickupPointMap
            mapPin={mapPin}
            labels={{
              hint: labels.mapHint,
              searchLabel: labels.mapSearchLabel,
              searchPlaceholder: labels.mapSearchPlaceholder,
              searchNoResults: labels.mapSearchNoResults,
            }}
            onChange={(pin) => {
              onMapPinChange(pin);
              if (editingPoint) {
                onEditPointChange({ ...editingPoint, ...pin });
              } else {
                onPointDraftChange({ ...pointDraft, ...pin });
              }
            }}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label className="font-label text-label-bold text-on-surface block">
                {labels.name}
              </label>
              <input
                value={activeDraft.name}
                maxLength={PICKUP_POINT_NAME_MAX_LENGTH}
                onChange={(event) => {
                  const name = event.target.value;
                  if (editingPoint) {
                    onEditPointChange({ ...editingPoint, name });
                  } else {
                    onPointDraftChange({ ...pointDraft, name });
                  }
                }}
                placeholder={labels.namePlaceholder}
                aria-label={labels.name}
                className={fieldClass}
              />
            </div>
            <div className="space-y-3">
              <label className="font-label text-label-bold text-on-surface block">
                {labels.fee}
              </label>
              <div className="border-outline-variant/40 focus-within:border-secondary bg-surface-container-low flex items-center rounded-xl border-2 px-4 py-3 transition-colors">
                <span className="text-on-surface-variant font-body text-sm">
                  S/
                </span>
                <GranularNumberInput
                  mode="decimal"
                  min={0}
                  emptyFallback={0}
                  value={activeDraft.fee}
                  onValueChange={(next) => {
                    const fee = next ?? 0;
                    if (editingPoint) {
                      onEditPointChange({ ...editingPoint, fee });
                    } else {
                      onPointDraftChange({ ...pointDraft, fee });
                    }
                  }}
                  placeholder={labels.feePlaceholder}
                  aria-label={labels.fee}
                  className="text-primary font-body text-body-md ml-2 w-full border-none bg-transparent p-0 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {pointError ? (
          <p className="text-error font-body text-body-md" role="alert">
            {pointError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {editingPoint ? (
            <>
              <button
                type="button"
                disabled={pointSubmitting}
                onClick={onSaveEditPoint}
                className="bg-primary text-on-primary press-down font-label text-label-bold inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {labels.save}
              </button>
              <button
                type="button"
                onClick={onCancelEditPoint}
                className="border-outline-variant/40 text-on-surface-variant font-label text-label-bold inline-flex min-h-11 items-center justify-center rounded-full border-2 px-6 py-3"
              >
                {labels.cancel}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={pointSubmitting || !pointDraft.name.trim()}
              onClick={onAddPoint}
              className="bg-primary text-on-primary press-down font-label text-label-bold inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-5 w-5" aria-hidden />
              {pointSubmitting ? labels.addingPoint : labels.addPoint}
            </button>
          )}
        </div>

        {points.length === 0 ? (
          <div className="border-outline-variant/10 bg-surface-container-low rounded-xl border p-8 text-center">
            <p className="font-body text-body-md text-on-surface-variant">
              {labels.emptyPoints}
            </p>
          </div>
        ) : (
          <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl overflow-x-auto border shadow-xl">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low border-outline-variant/20 border-b">
                  {[
                    labels.columns.name,
                    labels.columns.fee,
                    labels.columns.status,
                    labels.columns.order,
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
                {points.map((point) => (
                  <tr
                    key={point.id}
                    className={cn(
                      "hover:bg-surface-bright transition-colors",
                      !point.isActive && "opacity-75",
                    )}
                  >
                    <td className="font-body text-body-md text-on-surface px-6 py-5">
                      {point.name}
                    </td>
                    <td className="font-body text-body-md text-on-surface px-6 py-5">
                      {labels.formatPrice(point.fee.toFixed(2))}
                    </td>
                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => onTogglePointActive(point)}
                        className="cursor-pointer"
                      >
                        <StatusBadge active={point.isActive} labels={labels} />
                      </button>
                    </td>
                    <td className="font-body text-body-md text-on-surface-variant px-6 py-5">
                      {labels.formatOrder(point.sortOrder)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          aria-label={labels.formatAriaEdit(point.name)}
                          onClick={() => onStartEditPoint(point)}
                          className="border-outline-variant/40 text-on-surface-variant hover:border-secondary inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-2"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          disabled={deletingPointId === point.id}
                          aria-label={labels.formatAriaDelete(point.name)}
                          onClick={() => onDeletePoint(point.id)}
                          className="border-outline-variant/40 text-error hover:border-error inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
