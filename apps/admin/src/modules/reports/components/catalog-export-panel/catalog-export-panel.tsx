"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@de-tin-marin/ui/button";
import { cn } from "@de-tin-marin/shared/cn";
import type { CatalogExportPanelProps } from "./catalog-export-panel.types";
import { hasSelectedSection } from "./catalog-export-panel.helpers";

export function CatalogExportPanel({
  title,
  description,
  downloadLabel,
  downloadingLabel,
  emptySelectionLabel,
  errorLabel,
  sections,
  selected,
  downloading,
  error,
  onToggle,
  onDownload,
}: CatalogExportPanelProps) {
  const canDownload = hasSelectedSection(selected) && !downloading;

  return (
    <section
      aria-labelledby="catalog-export-title"
      aria-busy={downloading}
      className="bg-surface-container-lowest border-surface-container-high rounded-[20px] border p-4 sm:p-6 lg:rounded-[24px]"
    >
      <div className="mb-4 flex flex-col gap-2 sm:mb-5">
        <h2
          id="catalog-export-title"
          className="font-display text-headline-md text-on-surface"
        >
          {title}
        </h2>
        <p className="font-body text-body-md text-on-surface-variant max-w-2xl">
          {description}
        </p>
      </div>

      <fieldset className="mb-5" disabled={downloading}>
        <legend className="sr-only">{title} — secciones</legend>
        <ul className="gap-stack-sm grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {sections.map((section) => {
            const checked = selected[section.id];
            const inputId = `catalog-export-${section.id}`;
            return (
              <li key={section.id}>
                <label
                  htmlFor={inputId}
                  className={cn(
                    "border-outline-variant/40 bg-surface-container-low flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                    checked && "border-secondary/40 bg-secondary-container/20",
                    downloading && "cursor-not-allowed opacity-70",
                  )}
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={checked}
                    disabled={downloading}
                    onChange={() => onToggle(section.id)}
                    className="border-outline text-secondary focus-visible:ring-secondary h-4 w-4 rounded accent-current disabled:cursor-not-allowed"
                  />
                  <span className="font-label text-label-bold text-on-surface text-sm">
                    {section.label}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {!hasSelectedSection(selected) ? (
        <p className="font-body text-body-md text-on-surface-variant mb-4">
          {emptySelectionLabel}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="font-body text-body-md text-error mb-4">
          {errorLabel}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={onDownload}
        disabled={!canDownload}
        aria-busy={downloading}
        className="min-h-11"
      >
        {downloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Download className="mr-2 h-4 w-4" aria-hidden />
        )}
        {downloading ? downloadingLabel : downloadLabel}
      </Button>
    </section>
  );
}
