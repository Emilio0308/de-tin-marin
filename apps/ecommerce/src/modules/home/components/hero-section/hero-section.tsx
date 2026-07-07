import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { HeroSectionProps } from "./hero-section.types";

const HERO_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDc5FMBIxWj0PpOIyY67f8C27ZZ-i2I6SgndhcTSAJr-8b8gaRw4PssOD6J-X2x58UnXFF9b-TIBChWEnLfaaLTpH_Xd6Jp1eu0tREtPJKbIuDZoIy3ZmQ6NG0EcwbR_jlz5AqydaCCtyUxuTCceTHl_SxfnSE2iTm6txCVV7PUKbcO3H2lcqeaKRQW-lpa3d5mMjQ20h0cyxd6kEac3yvY4BNbC_58r2Bxrb5b_4HdWQ_ZalJj9TsT91gklkrpjo79Ft9Xusxf-kc";

export function HeroSection({
  titlePrefix,
  titleHighlight,
  description,
  ctaSurprises,
  ctaProducts,
  imageAlt,
  favoriteKit,
}: HeroSectionProps) {
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
              href="/sorpresas"
              className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary rounded-full px-10 py-4 transition-all duration-300 hover:scale-105"
            >
              {ctaSurprises}
            </Link>
            <Link
              href="/productos"
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
              <Image
                src={HERO_IMAGE_URL}
                alt={imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 28rem"
                className="object-cover"
              />
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
