"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Star,
} from "lucide-react";
import { cn } from "@de-tin-marin/shared/cn";
import type { HeroSectionProps } from "./hero-section.types";
import { shouldUseCarousel } from "./hero-section.helpers";
import { storefrontTabHref } from "@/modules/home/helpers/storefront-url";

const AUTOPLAY_MS = 5000;

export function HeroSection({
  titlePrefix,
  titleHighlight,
  description,
  ctaSurprises,
  ctaProducts,
  benefits,
  imageAlt,
  favoriteKit,
  displayMode,
  slides,
  prevLabel,
  nextLabel,
  pauseLabel,
  resumeLabel,
  carouselLabel,
  slideLabel,
}: HeroSectionProps) {
  const carousel = shouldUseCarousel(displayMode, slides.length);
  const [index, setIndex] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isInteractionPaused, setIsInteractionPaused] = useState(false);
  const safeIndex = slides.length === 0 ? 0 : index % slides.length;
  const current = slides[safeIndex] ?? slides[0];

  useEffect(() => {
    if (!carousel || isManuallyPaused || isInteractionPaused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [carousel, isInteractionPaused, isManuallyPaused, slides.length]);

  useEffect(() => {
    setIndex(0);
  }, [slides.length, displayMode]);

  const alt = current?.altText?.trim() || imageAlt;

  return (
    <section
      aria-roledescription={carousel ? "carrusel" : undefined}
      aria-label={carousel ? carouselLabel : undefined}
      className="bg-surface-container-low min-h-145 md:min-h-155 relative flex items-center overflow-hidden"
      onMouseEnter={() => setIsInteractionPaused(true)}
      onMouseLeave={() => setIsInteractionPaused(false)}
      onFocusCapture={() => setIsInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setIsInteractionPaused(false);
        }
      }}
    >
      <div className="container-max gap-stack-lg px-gutter relative z-10 grid w-full grid-cols-1 items-center py-12 lg:grid-cols-2 lg:py-0">
        <div className="space-y-stack-md text-center lg:text-left">
          <p className="font-label text-label-bold text-secondary bg-secondary-fixed/50 inline-flex items-center gap-2 rounded-full px-4 py-2">
            <Star className="h-4 w-4" aria-hidden />
            {favoriteKit}
          </p>
          <h1 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
            {titlePrefix}
            <span className="text-primary italic">{titleHighlight}</span>
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant mx-auto max-w-xl leading-relaxed lg:mx-0">
            {description}
          </p>
          <div className="gap-stack-sm flex flex-wrap justify-center pt-4 lg:justify-start">
            <Link
              href={storefrontTabHref("sorpresas")}
              className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary hover:bg-primary-container focus-visible:ring-primary inline-flex min-h-12 items-center justify-center rounded-full px-8 py-3 transition-[transform,background-color] duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2"
            >
              {ctaSurprises}
            </Link>
            <Link
              href={storefrontTabHref("productos")}
              className="border-primary text-primary font-label text-label-bold hover:bg-primary-fixed focus-visible:ring-primary inline-flex min-h-12 items-center justify-center rounded-full border-2 px-8 py-3 transition-[transform,background-color] duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2"
            >
              {ctaProducts}
            </Link>
          </div>
          <ul className="font-body text-body-sm text-on-surface-variant flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2 lg:justify-start">
            {benefits.map((benefit) => (
              <li key={benefit} className="inline-flex items-center gap-1.5">
                <Check
                  className="text-secondary h-4 w-4"
                  aria-hidden
                  strokeWidth={2.5}
                />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative aspect-square w-full max-w-md">
            <div className="bg-secondary-container absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl" />
            <div className="bg-primary-container absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-30 blur-3xl" />
            <div className="border-surface-container-lowest/80 relative z-10 h-full w-full rotate-1 transform overflow-hidden rounded-[40px] border-8 shadow-2xl">
              {current ? (
                <Image
                  key={current.imageUrl}
                  src={current.imageUrl}
                  alt={alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 28rem"
                  className="object-cover transition-opacity duration-500"
                />
              ) : null}

              {carousel ? (
                <>
                  <button
                    type="button"
                    aria-label={prevLabel}
                    className="bg-surface/90 text-on-surface hover:bg-surface focus-visible:ring-primary absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                    onClick={() =>
                      setIndex(
                        (prev) => (prev - 1 + slides.length) % slides.length,
                      )
                    }
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label={nextLabel}
                    className="bg-surface/90 text-on-surface hover:bg-surface focus-visible:ring-primary absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                    onClick={() =>
                      setIndex((prev) => (prev + 1) % slides.length)
                    }
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      aria-label={isManuallyPaused ? resumeLabel : pauseLabel}
                      className="bg-surface/90 text-on-surface hover:bg-surface focus-visible:ring-primary flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                      onClick={() => setIsManuallyPaused((paused) => !paused)}
                    >
                      {isManuallyPaused ? (
                        <Play className="h-4 w-4" aria-hidden />
                      ) : (
                        <Pause className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                    {slides.map((slide, i) => (
                      <button
                        key={`${slide.imageUrl}-${i}`}
                        type="button"
                        aria-label={slideLabel(i + 1, slides.length)}
                        aria-current={i === safeIndex}
                        className={cn(
                          "focus-visible:ring-primary h-3 w-3 rounded-full transition-[transform,background-color] focus-visible:outline-none focus-visible:ring-2",
                          i === safeIndex
                            ? "bg-primary scale-110"
                            : "bg-surface/70 hover:bg-surface hover:scale-110",
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

      <div className="bg-surface-container-high/50 absolute right-0 top-0 h-full w-1/3 translate-x-1/2 -skew-x-12 transform" />
    </section>
  );
}
