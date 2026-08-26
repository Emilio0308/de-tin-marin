"use client";

import { ChevronDown, MapPinned, Plus, Save } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { CourierDestinationsProps } from "./courier-destinations.types";

const cardClass =
  "bg-surface-container-lowest border-outline-variant/40 flex flex-col gap-4 rounded-2xl border p-5 shadow-sm lg:p-8";
const fieldClass =
  "border-outline-variant/40 focus:border-secondary bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors";

function ToggleSwitch({
  checked,
  label,
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onChange();
      }}
      className={cn(
        "inline-flex h-7 w-14 shrink-0 items-center rounded-full px-0.5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
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
  );
}

export function CourierDestinations({
  departments,
  availableCatalogDepartments,
  selectedCatalogDepartment,
  labels,
  loading,
  loadError,
  savingDepartmentId,
  addingDepartment,
  departmentError,
  onSelectedCatalogDepartmentChange,
  onAddDepartment,
  onToggleDepartment,
  onToggleProvince,
  onSaveDepartment,
}: CourierDestinationsProps) {
  if (loading) {
    return (
      <div className="px-margin-mobile sm:px-stack-md lg:px-8">
        <p className="text-on-surface-variant">{labels.loading}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-margin-mobile sm:px-stack-md lg:px-8">
        <p className="text-error">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="px-margin-mobile pb-stack-md sm:px-stack-md flex flex-col gap-6 lg:px-8 lg:pb-8">
      <div>
        <h1 className="font-display text-headline-lg text-on-surface font-bold">
          {labels.title}
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          {labels.subtitle}
        </p>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-3">
          <span className="bg-primary-fixed text-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <Plus className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="font-display text-headline-md text-on-surface font-bold">
            {labels.sectionAddDepartment}
          </h2>
        </div>

        {availableCatalogDepartments.length === 0 ? (
          <p className="text-on-surface-variant text-sm">
            {labels.noDepartmentsToAdd}
          </p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="font-label text-label-bold text-on-surface-variant text-xs uppercase tracking-wide">
                {labels.selectDepartment}
              </span>
              <select
                value={selectedCatalogDepartment}
                onChange={(event) =>
                  onSelectedCatalogDepartmentChange(event.target.value)
                }
                className={fieldClass}
              >
                <option value="">{labels.selectDepartmentPlaceholder}</option>
                {availableCatalogDepartments.map((entry) => (
                  <option key={entry.name} value={entry.name}>
                    {entry.name} ({entry.provinces.length} provincias)
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedCatalogDepartment || addingDepartment}
              onClick={onAddDepartment}
              className="bg-primary text-on-primary font-label text-label-bold inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full px-5 py-2.5 disabled:opacity-60 sm:self-auto"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {addingDepartment
                ? labels.addingDepartment
                : labels.addDepartment}
            </button>
          </div>
        )}
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-3">
          <span className="bg-primary-fixed text-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <MapPinned className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="font-display text-headline-md text-on-surface font-bold">
            {labels.sectionDepartments}
          </h2>
        </div>

        <p className="text-on-surface-variant text-sm">{labels.piuraNote}</p>

        {departmentError ? (
          <p className="text-error text-sm" role="alert">
            {departmentError}
          </p>
        ) : null}

        {departments.length === 0 ? (
          <p className="text-on-surface-variant text-sm">
            {labels.emptyDepartments}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {departments.map((department) => {
              const enabledCount = department.provinces.filter(
                (province) => province.enabled,
              ).length;
              const isSaving = savingDepartmentId === department.id;

              return (
                <details
                  key={department.id}
                  className="border-outline-variant/40 bg-surface-container rounded-2xl border"
                  open={departments.length <= 3}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 [&::-webkit-details-marker]:hidden">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-label text-label-bold text-on-surface">
                        {department.name}
                      </span>
                      <span className="text-on-surface-variant text-xs">
                        {enabledCount}/{department.provinces.length}{" "}
                        {labels.provinceEnabled}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <ToggleSwitch
                        checked={department.isActive}
                        label={`${department.name} ${department.isActive ? labels.departmentActive : labels.departmentInactive}`}
                        onChange={() => onToggleDepartment(department)}
                      />
                      <ChevronDown
                        className="text-on-surface-variant h-5 w-5 shrink-0"
                        aria-hidden
                      />
                    </div>
                  </summary>

                  <div className="border-outline-variant/30 flex flex-col gap-3 border-t px-4 py-4">
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {department.provinces.map((province) => (
                        <li
                          key={province.slug}
                          className="bg-surface-container-low flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                        >
                          <span className="font-body text-body-md text-on-surface">
                            {province.name}
                          </span>
                          <ToggleSwitch
                            checked={province.enabled}
                            label={province.name}
                            onChange={() =>
                              onToggleProvince(department, province.slug)
                            }
                          />
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => onSaveDepartment(department)}
                      className="bg-primary text-on-primary font-label text-label-bold inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full px-5 py-2.5 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" aria-hidden />
                      {isSaving
                        ? labels.savingDepartment
                        : labels.saveDepartment}
                    </button>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
