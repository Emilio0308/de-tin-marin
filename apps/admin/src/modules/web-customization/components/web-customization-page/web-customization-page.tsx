"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Eye,
  Home,
  ImagePlus,
  Info,
  Pencil,
  Save,
  Settings,
  Trash2,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { HeroImageDTO } from "@/modules/web-customization/types/hero.dto";
import { HeroStorefrontPreview } from "./hero-storefront-preview";
import type { WebCustomizationPageProps } from "./web-customization-page.types";

const cardClass =
  "bg-surface-container-lowest border-outline-variant/40 flex flex-col gap-4 rounded-2xl border p-5 shadow-sm lg:p-8";
const labelClass =
  "font-label text-label-bold text-on-surface-variant text-xs uppercase tracking-wide";
const fieldClass =
  "border-outline-variant/40 focus:border-secondary bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors";

type WebCustomizationTab = "home" | "about";

function tabClass(selected: boolean): string {
  return cn(
    "font-label text-label-bold inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm transition-colors",
    selected
      ? "border-primary bg-primary/5 text-primary"
      : "border-outline-variant/40 text-on-surface-variant hover:border-secondary/60",
  );
}

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

export function WebCustomizationPage({
  labels,
  settings,
  images,
  loading,
  loadError,
  settingsSubmitting,
  settingsMessage,
  settingsError,
  imageError,
  draft,
  imageSubmitting,
  canSaveDraft,
  onDisplayModeChange,
  onSaveSettings,
  onStartAdd,
  onStartEdit,
  onCancelDraft,
  onDraftChange,
  onPickFile,
  onSaveDraft,
  onDelete,
  onMove,
  aboutPreviewUrl,
  aboutSubmitting,
  aboutError,
  aboutMessage,
  canSaveAbout,
  canRestoreAbout,
  onAboutPickFile,
  onSaveAbout,
  onRestoreAbout,
}: WebCustomizationPageProps) {
  const [activeTab, setActiveTab] = useState<WebCustomizationTab>("home");

  const previewSlides = useMemo(() => {
    const fromList = images.map((image) => ({
      imageUrl: image.imageUrl,
      altText: image.altText,
    }));

    if (!draft) return fromList;

    const draftUrl = draft.previewUrl?.trim() || draft.imageUrl.trim();
    if (!draftUrl) return fromList;

    const draftSlide = {
      imageUrl: draftUrl,
      altText: draft.altText.trim() || null,
    };

    if (draft.id) {
      return images.map((image) =>
        image.id === draft.id
          ? draftSlide
          : { imageUrl: image.imageUrl, altText: image.altText },
      );
    }

    return [...fromList, draftSlide];
  }, [draft, images]);

  if (loading) {
    return (
      <p className="font-body text-body-md text-on-surface-variant p-6">
        {labels.loading}
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="font-body text-body-md text-error p-6" role="alert">
        {loadError}
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-display-sm text-on-surface font-bold">
          {labels.title}
        </h1>
        <p className="font-body text-body-md text-on-surface-variant">
          {labels.subtitle}
        </p>
      </header>

      <div
        role="tablist"
        aria-label={labels.tabListLabel}
        className="bg-surface-container-low inline-flex w-full flex-wrap gap-2 rounded-2xl p-2 sm:w-fit"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "home"}
          className={tabClass(activeTab === "home")}
          onClick={() => setActiveTab("home")}
        >
          <Home className="h-4 w-4" aria-hidden />
          {labels.tabHome}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "about"}
          className={tabClass(activeTab === "about")}
          onClick={() => setActiveTab("about")}
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          {labels.tabAbout}
        </button>
      </div>

      {activeTab === "home" ? (
        <div role="tabpanel" className="flex flex-col gap-8">
          <section className={cardClass}>
            <SectionHeader
              icon={<Settings className="h-5 w-5" />}
              title={labels.sectionMode}
            />
            <p className="text-on-surface-variant/80 text-sm">
              {labels.modeHint}
            </p>
            <div className="flex flex-wrap gap-3">
              {(["static", "carousel"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onDisplayModeChange(mode)}
                  className={cn(
                    "font-label text-label-bold rounded-full border-2 px-5 py-2.5 transition-colors",
                    settings.displayMode === mode
                      ? "border-primary bg-primary-fixed text-on-primary-fixed"
                      : "border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low",
                  )}
                >
                  {mode === "static" ? labels.modeStatic : labels.modeCarousel}
                </button>
              ))}
            </div>
            {settingsError ? (
              <p className="text-error text-sm" role="alert">
                {settingsError}
              </p>
            ) : null}
            {settingsMessage ? (
              <p className="text-secondary text-sm">{settingsMessage}</p>
            ) : null}
            <button
              type="button"
              onClick={onSaveSettings}
              disabled={settingsSubmitting}
              className="bg-primary text-on-primary font-label text-label-bold inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {settingsSubmitting ? labels.savingSettings : labels.saveSettings}
            </button>
          </section>

          <section className={cardClass}>
            <SectionHeader
              icon={<Eye className="h-5 w-5" />}
              title={labels.sectionPreview}
            />
            <HeroStorefrontPreview
              displayMode={settings.displayMode}
              slides={previewSlides}
              emptyLabel={labels.previewEmpty}
              modeStaticLabel={labels.modeStatic}
              modeCarouselLabel={labels.modeCarousel}
              prevLabel={labels.previewPrev}
              nextLabel={labels.previewNext}
            />
          </section>

          <section className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeader
                icon={<ImagePlus className="h-5 w-5" />}
                title={labels.sectionImages}
              />
              {!draft ? (
                <button
                  type="button"
                  onClick={onStartAdd}
                  className="border-primary text-primary font-label text-label-bold hover:bg-primary-container rounded-full border-2 px-5 py-2"
                >
                  {labels.addImage}
                </button>
              ) : null}
            </div>
            <p className="text-on-surface-variant/80 flex items-start gap-2 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              {labels.imageRequirements}
            </p>

            {draft ? (
              <div className="bg-surface-container flex flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="bg-surface-container-high relative aspect-square w-full max-w-[160px] overflow-hidden rounded-xl">
                    {draft.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin preview blob/cdn
                      <img
                        src={draft.previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-on-surface-variant flex h-full items-center justify-center p-3 text-center text-xs">
                        {labels.pickImageHint}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    <label className={labelClass}>
                      {draft.pendingFile || draft.imageUrl
                        ? labels.changeImage
                        : labels.pickImage}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="mt-2 block w-full text-sm"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          onPickFile(file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <label className={labelClass}>
                      {labels.altText}
                      <input
                        type="text"
                        className={cn(fieldClass, "mt-1")}
                        value={draft.altText}
                        placeholder={labels.altPlaceholder}
                        onChange={(event) =>
                          onDraftChange({
                            ...draft,
                            altText: event.target.value,
                          })
                        }
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className={labelClass}>
                        {labels.startsAt}
                        <input
                          type="datetime-local"
                          className={cn(fieldClass, "mt-1")}
                          value={draft.startsAtLocal}
                          onChange={(event) =>
                            onDraftChange({
                              ...draft,
                              startsAtLocal: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className={labelClass}>
                        {labels.endsAt}
                        <input
                          type="datetime-local"
                          className={cn(fieldClass, "mt-1")}
                          value={draft.endsAtLocal}
                          onChange={(event) =>
                            onDraftChange({
                              ...draft,
                              endsAtLocal: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
                {imageError ? (
                  <p className="text-error text-sm" role="alert">
                    {imageError}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onSaveDraft}
                    disabled={imageSubmitting || !canSaveDraft}
                    className="bg-primary text-on-primary font-label text-label-bold inline-flex items-center gap-2 rounded-full px-5 py-2.5 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {imageSubmitting ? labels.savingImage : labels.saveImage}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelDraft}
                    disabled={imageSubmitting}
                    className="font-label text-label-bold text-on-surface-variant rounded-full px-5 py-2.5"
                  >
                    {labels.cancel}
                  </button>
                </div>
              </div>
            ) : null}

            {images.length === 0 && !draft ? (
              <p className="text-on-surface-variant text-sm">
                {labels.emptyImages}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {images.map((image, index) => (
                  <ImageRow
                    key={image.id}
                    image={image}
                    index={index}
                    total={images.length}
                    labels={labels}
                    onEdit={() => onStartEdit(image)}
                    onDelete={() => onDelete(image.id)}
                    onMoveUp={() => onMove(image.id, "up")}
                    onMoveDown={() => onMove(image.id, "down")}
                  />
                ))}
              </ul>
            )}

            <p className="text-on-surface-variant/70 flex items-start gap-2 text-xs">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {labels.infoTip}
            </p>
          </section>
        </div>
      ) : (
        <div role="tabpanel" className="flex flex-col gap-8">
          <section className={cardClass}>
            <SectionHeader
              icon={<BookOpen className="h-5 w-5" />}
              title={labels.aboutSection}
            />
            <p className="text-on-surface-variant/80 flex items-start gap-2 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              {labels.aboutRequirements}
            </p>

            <div className="bg-surface-container-high relative aspect-[1.79] w-full overflow-hidden rounded-xl">
              {aboutPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin preview blob/cdn
                <img
                  src={aboutPreviewUrl}
                  alt={labels.aboutPreviewAlt}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-on-surface-variant flex h-full items-center justify-center p-4 text-center text-sm">
                  {labels.aboutUsingDefault}
                </div>
              )}
            </div>

            <label className={labelClass}>
              {aboutPreviewUrl
                ? labels.aboutChangeImage
                : labels.aboutPickImage}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 block w-full text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  onAboutPickFile(file);
                  event.target.value = "";
                }}
              />
            </label>
            {!aboutPreviewUrl ? (
              <p className="text-on-surface-variant text-xs">
                {labels.aboutPickHint}
              </p>
            ) : null}

            {aboutError ? (
              <p className="text-error text-sm" role="alert">
                {aboutError}
              </p>
            ) : null}
            {aboutMessage ? (
              <p className="text-secondary text-sm">{aboutMessage}</p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSaveAbout}
                disabled={aboutSubmitting || !canSaveAbout}
                className="bg-primary text-on-primary font-label text-label-bold inline-flex items-center gap-2 rounded-full px-5 py-2.5 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {aboutSubmitting ? labels.aboutSaving : labels.aboutSave}
              </button>
              <button
                type="button"
                onClick={onRestoreAbout}
                disabled={aboutSubmitting || !canRestoreAbout}
                className="font-label text-label-bold text-on-surface-variant rounded-full px-5 py-2.5 disabled:opacity-60"
              >
                {labels.aboutRestoreDefault}
              </button>
            </div>

            <p className="text-on-surface-variant/70 flex items-start gap-2 text-xs">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {labels.aboutInfoTip}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function ImageRow({
  image,
  index,
  total,
  labels,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  image: HeroImageDTO;
  index: number;
  total: number;
  labels: WebCustomizationPageProps["labels"];
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <li className="bg-surface-container flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin list thumb */}
        <img
          src={image.imageUrl}
          alt={image.altText ?? ""}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-label text-label-bold text-on-surface">
          #{index + 1} · orden {image.sortOrder}
        </p>
        <p className="text-on-surface-variant truncate text-xs">
          {new Date(image.startsAt).toLocaleString()} →{" "}
          {new Date(image.endsAt).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        <IconButton
          label={labels.moveUp}
          disabled={index === 0}
          onClick={onMoveUp}
        >
          <ArrowUp className="h-4 w-4" />
        </IconButton>
        <IconButton
          label={labels.moveDown}
          disabled={index === total - 1}
          onClick={onMoveDown}
        >
          <ArrowDown className="h-4 w-4" />
        </IconButton>
        <IconButton label={labels.columnsActions} onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </IconButton>
        <IconButton label={labels.delete} onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </li>
  );
}

function IconButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="bg-surface-container-lowest text-on-surface-variant hover:text-on-surface inline-flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-40"
    >
      {children}
    </button>
  );
}
