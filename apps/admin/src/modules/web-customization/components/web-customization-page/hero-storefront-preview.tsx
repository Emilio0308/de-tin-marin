"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { HeroDisplayMode } from "@/modules/web-customization/types/hero.dto";

const AUTOPLAY_MS = 4000;

export type HeroPreviewSlide = {
  imageUrl: string;
  altText: string | null;
};

type HeroStorefrontPreviewProps = {
  displayMode: HeroDisplayMode;
  slides: HeroPreviewSlide[];
  emptyLabel: string;
  modeStaticLabel: string;
  modeCarouselLabel: string;
  prevLabel: string;
  nextLabel: string;
};

export function HeroStorefrontPreview({
  displayMode,
  slides,
  emptyLabel,
  modeStaticLabel,
  modeCarouselLabel,
  prevLabel,
  nextLabel,
}: HeroStorefrontPreviewProps) {
  const useCarousel = displayMode === "carousel" && slides.length > 1;
  const visibleSlides = displayMode === "static" ? slides.slice(0, 1) : slides;
  const firstSlideUrl = visibleSlides[0]?.imageUrl;
  const [index, setIndex] = useState(0);
  const safeIndex =
    visibleSlides.length === 0 ? 0 : index % visibleSlides.length;
  const current = visibleSlides[safeIndex];

  useEffect(() => {
    setIndex(0);
  }, [displayMode, visibleSlides.length, firstSlideUrl]);

  useEffect(() => {
    if (!useCarousel) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % visibleSlides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [useCarousel, visibleSlides.length]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <span className="bg-surface-container font-label text-label-bold text-on-surface-variant rounded-full px-3 py-1 text-[11px] uppercase">
          {displayMode === "carousel" ? modeCarouselLabel : modeStaticLabel}
        </span>
      </div>

      <div className="bg-surface-container-low relative flex justify-center overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="relative aspect-square w-full max-w-[280px]">
          <div className="bg-secondary-container absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl" />
          <div className="bg-primary-container absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-30 blur-2xl" />
          <div className="relative z-10 h-full w-full rotate-2 overflow-hidden rounded-[28px] shadow-xl">
            {current ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin CDN/blob preview
              <img
                key={current.imageUrl}
                src={current.imageUrl}
                alt={current.altText ?? ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="bg-surface-container-high text-on-surface-variant flex h-full w-full items-center justify-center p-4 text-center text-sm">
                {emptyLabel}
              </div>
            )}

            {useCarousel ? (
              <>
                <button
                  type="button"
                  aria-label={prevLabel}
                  className="bg-surface/80 text-on-surface absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full"
                  onClick={() =>
                    setIndex(
                      (prev) =>
                        (prev - 1 + visibleSlides.length) %
                        visibleSlides.length,
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={nextLabel}
                  className="bg-surface/80 text-on-surface absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full"
                  onClick={() =>
                    setIndex((prev) => (prev + 1) % visibleSlides.length)
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
                  {visibleSlides.map((slide, i) => (
                    <button
                      key={`${slide.imageUrl}-${i}`}
                      type="button"
                      aria-label={`${i + 1}`}
                      aria-current={i === safeIndex}
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        i === safeIndex
                          ? "bg-primary"
                          : "bg-surface/70 hover:bg-surface",
                      )}
                      onClick={() => setIndex(i)}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
