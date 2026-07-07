"use client";

import type { ReactNode } from "react";
import {
  Info,
  Pencil,
  Plus,
  Save,
  Settings,
  Trash2,
  Truck,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { DeliveryZoneDTO } from "@/modules/delivery/types/delivery.dto";
import { DISTRICT_MAX_LENGTH } from "./delivery-settings.helpers";
import type {
  DeliverySettingsLabels,
  DeliverySettingsProps,
  ZoneEditDraft,
} from "./delivery-settings.types";

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

function StatusBadge({
  active,
  labels,
}: {
  active: boolean;
  labels: DeliverySettingsLabels;
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

function SettingsToggle({
  title,
  hint,
  checked,
  onChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="bg-surface-container flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-label text-label-bold text-on-surface">{title}</p>
        <p className="text-on-surface-variant/70 text-xs">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={cn(
          "inline-flex h-7 w-14 shrink-0 items-center rounded-full px-0.5 transition-colors duration-200",
          checked ? "bg-primary" : "bg-surface-container-highest",
        )}
      >
        <span
          className={cn(
            "h-6 w-6 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-7" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

function ZoneActions({
  zone,
  labels,
  editing,
  deleting,
  onEdit,
  onDelete,
  variant,
}: {
  zone: DeliveryZoneDTO;
  labels: DeliverySettingsLabels;
  editing: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  variant: "table" | "card";
}) {
  if (editing) return null;

  if (variant === "card") {
    return (
      <div className="mt-3 flex gap-4">
        <button
          type="button"
          aria-label={labels.formatAriaEdit(zone.district)}
          onClick={onEdit}
          className="text-primary font-label text-label-bold flex items-center gap-1 transition-transform active:scale-95"
        >
          <Pencil className="h-[18px] w-[18px]" aria-hidden />
          {labels.edit}
        </button>
        <button
          type="button"
          aria-label={labels.formatAriaDelete(zone.district)}
          disabled={deleting}
          onClick={onDelete}
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
      <button
        type="button"
        aria-label={labels.formatAriaEdit(zone.district)}
        onClick={onEdit}
        className="text-on-surface-variant hover:bg-primary-container/10 hover:text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label={labels.formatAriaDelete(zone.district)}
        disabled={deleting}
        onClick={onDelete}
        className="text-on-surface-variant hover:bg-error-container/10 hover:text-error flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function EditZoneFields({
  draft,
  labels,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  draft: ZoneEditDraft;
  labels: DeliverySettingsLabels;
  onChange: (draft: ZoneEditDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <div className="grid flex-1 gap-3 sm:grid-cols-3">
        <input
          value={draft.district}
          maxLength={DISTRICT_MAX_LENGTH}
          onChange={(event) =>
            onChange({ ...draft, district: event.target.value })
          }
          className={fieldClass}
          aria-label={labels.district}
        />
        <div className="border-outline-variant/40 focus-within:border-secondary bg-surface-container-low flex items-center rounded-xl border-2 px-4 py-3 transition-colors">
          <span className="text-on-surface-variant font-body text-sm">S/</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={draft.fee}
            onChange={(event) =>
              onChange({
                ...draft,
                fee: Math.max(0, Number(event.target.value) || 0),
              })
            }
            className="text-primary font-body text-body-md ml-2 w-full border-none bg-transparent p-0 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label={labels.fee}
          />
        </div>
        <input
          type="number"
          min={0}
          step={1}
          value={draft.sortOrder}
          onChange={(event) =>
            onChange({
              ...draft,
              sortOrder: Math.max(
                0,
                Math.floor(Number(event.target.value) || 0),
              ),
            })
          }
          className={fieldClass}
          aria-label={labels.columns.order}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="border-secondary text-secondary hover:bg-secondary/5 press-down font-label text-label-bold min-h-11 rounded-full border-2 px-5 py-2 transition-colors"
        >
          {labels.cancel}
        </button>
        <button
          type="button"
          disabled={saving || !draft.district.trim()}
          onClick={onSave}
          className="bg-primary text-on-primary press-down font-label text-label-bold inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden />
          {labels.save}
        </button>
      </div>
    </div>
  );
}

export function DeliverySettings({
  settings,
  zones,
  zoneDraft,
  editingZone,
  labels,
  settingsSubmitting,
  zoneSubmitting,
  deletingZoneId,
  settingsError,
  zoneError,
  onSettingsChange,
  onSaveSettings,
  onZoneDraftChange,
  onAddZone,
  onStartEditZone,
  onCancelEditZone,
  onEditZoneChange,
  onSaveEditZone,
  onToggleZoneActive,
  onDeleteZone,
}: DeliverySettingsProps) {
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
          icon={<Settings className="h-5 w-5" aria-hidden />}
          title={labels.sectionGlobal}
        />
        <div className="flex flex-col gap-3">
          <SettingsToggle
            title={labels.pickupEnabled}
            hint={labels.pickupHint}
            checked={settings.pickupEnabled}
            onChange={(pickupEnabled) =>
              onSettingsChange({ ...settings, pickupEnabled })
            }
          />
          <SettingsToggle
            title={labels.deliveryEnabled}
            hint={labels.deliveryHint}
            checked={settings.deliveryEnabled}
            onChange={(deliveryEnabled) =>
              onSettingsChange({ ...settings, deliveryEnabled })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="fallbackFee">
            <span className="text-on-surface normal-case">
              {labels.fallbackFee}
            </span>
          </label>
          <div className="border-outline-variant/40 focus-within:border-secondary bg-surface-container-low flex max-w-xs items-center rounded-xl border-2 px-4 py-3 transition-colors">
            <span className="text-on-surface-variant font-body text-sm">
              S/
            </span>
            <input
              id="fallbackFee"
              type="number"
              min={0}
              step="0.01"
              value={settings.fallbackFee}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  fallbackFee: Math.max(0, Number(event.target.value) || 0),
                })
              }
              className="text-primary font-body text-body-md ml-2 w-full border-none bg-transparent p-0 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <p className="text-on-surface-variant/70 flex items-start gap-2 text-xs">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {labels.fallbackHint}
          </p>
        </div>
        {settingsError ? (
          <p className="text-error font-body text-body-md">{settingsError}</p>
        ) : null}
        <button
          type="button"
          disabled={settingsSubmitting}
          onClick={onSaveSettings}
          className="bg-primary text-on-primary hover:bg-primary-container press-down font-label text-label-bold shadow-primary/20 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-8 py-3 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
        >
          <Save className="h-5 w-5" aria-hidden />
          {settingsSubmitting ? labels.savingSettings : labels.saveSettings}
        </button>
      </section>

      <section className={cardClass}>
        <SectionHeader
          icon={<Truck className="h-5 w-5" aria-hidden />}
          title={labels.sectionZones}
        />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <input
              value={zoneDraft.district}
              maxLength={DISTRICT_MAX_LENGTH}
              onChange={(event) =>
                onZoneDraftChange({
                  ...zoneDraft,
                  district: event.target.value,
                })
              }
              placeholder={labels.districtPlaceholder}
              aria-label={labels.district}
              className={fieldClass}
            />
            <div className="border-outline-variant/40 focus-within:border-secondary bg-surface-container-low flex items-center rounded-xl border-2 px-4 py-3 transition-colors">
              <span className="text-on-surface-variant font-body text-sm">
                S/
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={zoneDraft.fee}
                onChange={(event) =>
                  onZoneDraftChange({
                    ...zoneDraft,
                    fee: Math.max(0, Number(event.target.value) || 0),
                  })
                }
                placeholder={labels.feePlaceholder}
                aria-label={labels.fee}
                className="text-primary font-body text-body-md ml-2 w-full border-none bg-transparent p-0 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={zoneSubmitting || !zoneDraft.district.trim()}
            onClick={onAddZone}
            className="bg-primary text-on-primary press-down font-label text-label-bold inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-5 w-5" aria-hidden />
            {zoneSubmitting ? labels.addingZone : labels.addZone}
          </button>
        </div>
        {zoneError ? (
          <p className="text-error font-body text-body-md">{zoneError}</p>
        ) : null}

        {zones.length === 0 ? (
          <div className="border-outline-variant/10 bg-surface-container-low rounded-xl border p-8 text-center">
            <p className="font-body text-body-md text-on-surface-variant">
              {labels.emptyZones}
            </p>
          </div>
        ) : (
          <>
            <div className="border-outline-variant/10 bg-surface-container-lowest rounded-4xl hidden overflow-hidden border shadow-xl lg:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low border-outline-variant/20 border-b">
                    {[
                      labels.columns.district,
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
                  {zones.map((zone) => {
                    const isEditing = editingZone?.id === zone.id;
                    return (
                      <tr
                        key={zone.id}
                        className={cn(
                          "hover:bg-surface-bright transition-colors",
                          !zone.isActive && "opacity-75",
                        )}
                      >
                        <td className="px-6 py-5" colSpan={isEditing ? 5 : 1}>
                          {isEditing && editingZone ? (
                            <EditZoneFields
                              draft={editingZone}
                              labels={labels}
                              onChange={onEditZoneChange}
                              onSave={onSaveEditZone}
                              onCancel={onCancelEditZone}
                              saving={zoneSubmitting}
                            />
                          ) : (
                            <p className="font-label text-body-md text-on-surface font-bold">
                              {zone.district}
                            </p>
                          )}
                        </td>
                        {!isEditing ? (
                          <>
                            <td className="text-primary px-6 py-5 font-bold">
                              {labels.formatPrice(zone.fee)}
                            </td>
                            <td className="px-6 py-5">
                              <button
                                type="button"
                                onClick={() => onToggleZoneActive(zone)}
                                aria-label={
                                  zone.isActive
                                    ? labels.statusActive
                                    : labels.statusInactive
                                }
                              >
                                <StatusBadge
                                  active={zone.isActive}
                                  labels={labels}
                                />
                              </button>
                            </td>
                            <td className="px-6 py-5">
                              <span className="bg-surface-container text-on-surface-variant font-label text-label-bold inline-flex h-8 w-8 items-center justify-center rounded-lg">
                                {zone.sortOrder}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <ZoneActions
                                zone={zone}
                                labels={labels}
                                editing={false}
                                deleting={deletingZoneId === zone.id}
                                onEdit={() => onStartEditZone(zone)}
                                onDelete={() => onDeleteZone(zone.id)}
                                variant="table"
                              />
                            </td>
                          </>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="bg-surface-container-low border-outline-variant/10 border-t px-6 py-4">
                <p className="font-label text-label-bold text-on-surface-variant text-xs">
                  {labels.formatPagination(zones.length, zones.length)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:hidden">
              {zones.map((zone) => {
                const isEditing = editingZone?.id === zone.id;
                return (
                  <article
                    key={zone.id}
                    className={cn(
                      "border-outline-variant/10 bg-surface-container-lowest soft-glow-pink rounded-xl border p-4",
                      !zone.isActive && "opacity-75",
                    )}
                  >
                    {isEditing && editingZone ? (
                      <EditZoneFields
                        draft={editingZone}
                        labels={labels}
                        onChange={onEditZoneChange}
                        onSave={onSaveEditZone}
                        onCancel={onCancelEditZone}
                        saving={zoneSubmitting}
                      />
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-label text-secondary text-[12px] font-bold uppercase tracking-wider">
                            {labels.formatOrder(zone.sortOrder)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleZoneActive(zone)}
                          >
                            <StatusBadge
                              active={zone.isActive}
                              labels={labels}
                            />
                          </button>
                        </div>
                        <h3 className="font-display text-headline-md text-on-surface mt-2 font-bold leading-tight">
                          {zone.district}
                        </h3>
                        <p className="text-primary font-display text-headline-sm mt-1 font-bold">
                          {labels.formatPrice(zone.fee)}
                        </p>
                        <ZoneActions
                          zone={zone}
                          labels={labels}
                          editing={false}
                          deleting={deletingZoneId === zone.id}
                          onEdit={() => onStartEditZone(zone)}
                          onDelete={() => onDeleteZone(zone.id)}
                          variant="card"
                        />
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <div className="bg-secondary-container/20 border-secondary/10 flex items-start gap-3 rounded-xl border p-4">
        <Info className="text-secondary h-5 w-5 shrink-0" aria-hidden />
        <p className="text-on-secondary-fixed-variant text-sm leading-relaxed">
          {labels.infoTip}
        </p>
      </div>
    </div>
  );
}
