"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
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
  imageAlt,
  favoriteKit,
  displayMode,
  slides,
  prevLabel,
  nextLabel,
}: HeroSectionProps) {
  const carousel = shouldUseCarousel(displayMode, slides.length);
  const [index, setIndex] = useState(0);
  const safeIndex = slides.length === 0 ? 0 : index % slides.length;
  const current = slides[safeIndex] ?? slides[0];

  useEffect(() => {
    if (!carousel) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [carousel, slides.length]);

  useEffect(() => {
    setIndex(0);
  }, [slides.length, displayMode]);

  const alt = current?.altText?.trim() || imageAlt;

  return (
    <section className="bg-surface-container-low relative flex min-h-[600px] items-center overflow-hidden">
      <div className="container-max gap-stack-lg px-gutter relative z-10 grid w-full grid-cols-1 items-center lg:grid-cols-2">
        <div className="space-y-stack-md text-center lg:text-left">
          <h1 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
            {titlePrefix}
            <span className="text-primary italic">{titleHighlight}</span>
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant mx-auto max-w-lg lg:mx-0">
            {description}
          </p>
          <div className="gap-stack-sm flex flex-wrap justify-center pt-4 lg:justify-start">
            <Link
              href={storefrontTabHref("sorpresas")}
              className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary rounded-full px-10 py-4 transition-all duration-300 hover:scale-105"
            >
              {ctaSurprises}
            </Link>
            <Link
              href={storefrontTabHref("productos")}
              className="border-primary text-primary font-label text-label-bold hover:bg-primary-container rounded-full border-2 px-10 py-4 transition-all duration-300 hover:scale-105"
            >
              {ctaProducts}
            </Link>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative aspect-square w-full max-w-md">
            <div className="bg-secondary-container absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl" />
            <div className="bg-primary-container absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-30 blur-3xl" />
            <div className="relative z-10 h-full w-full rotate-2 transform overflow-hidden rounded-[40px] shadow-2xl">
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
                    className="bg-surface/80 text-on-surface absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
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
                    className="bg-surface/80 text-on-surface absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
                    onClick={() =>
                      setIndex((prev) => (prev + 1) % slides.length)
                    }
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                    {slides.map((slide, i) => (
                      <button
                        key={`${slide.imageUrl}-${i}`}
                        type="button"
                        aria-label={`${i + 1}`}
                        aria-current={i === safeIndex}
                        className={cn(
                          "h-2.5 w-2.5 rounded-full transition-colors",
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
            <div className="border-secondary/10 bg-surface-container-lowest absolute -bottom-6 -right-6 z-20 -rotate-3 transform rounded-3xl border-2 p-4 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="bg-secondary text-on-secondary rounded-lg p-1">
                  <Star className="h-[18px] w-[18px]" />
                </span>
                <span className="font-label text-label-bold text-secondary">
                  {favoriteKit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-high/50 absolute right-0 top-0 h-full w-1/3 translate-x-1/2 -skew-x-12 transform" />
    </section>
  );
}
