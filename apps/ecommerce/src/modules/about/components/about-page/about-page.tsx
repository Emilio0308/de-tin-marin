"use client";

import type { ComponentType } from "react";
import Image from "next/image";
import {
  Cookie,
  Eye,
  HandHeart,
  Heart,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { AboutValueId } from "@/modules/about/data/about.data";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import type { AboutPageProps } from "./about-page.types";

const VALUE_ICON = {
  quality: Cookie,
  creativity: Sparkles,
  closeness: HandHeart,
} as const satisfies Record<
  AboutValueId,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
>;

const VALUE_ICON_WRAP: Record<AboutValueId, string> = {
  quality: "bg-secondary-fixed text-secondary",
  creativity: "bg-primary-fixed text-primary",
  closeness: "bg-tertiary-fixed text-tertiary",
};

function SocialIcon({ className, path }: { className?: string; path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d={path} />
    </svg>
  );
}

const FACEBOOK_PATH =
  "M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z";

const TIKTOK_PATH =
  "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.16 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.19 8.19 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1.01-.15Z";

export function AboutPage({ content, contact }: AboutPageProps) {
  const t = useTranslations("about");

  return (
    <StorefrontLayout>
      <section className="px-gutter py-stack-lg relative overflow-hidden md:py-20">
        <div className="container-max gap-gutter grid grid-cols-1 items-center lg:grid-cols-2">
          <div className="z-10 order-2 lg:order-1">
            <span className="bg-primary-fixed text-on-primary-fixed font-label text-label-bold mb-stack-sm inline-block rounded-full px-4 py-1">
              {content.storyEyebrow}
            </span>
            <h1 className="font-display text-display-lg-mobile md:text-display-lg text-primary mb-stack-md">
              {t("storyTitle")}
            </h1>
            <p className="font-body text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
              {content.storyBody}
            </p>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="bg-secondary-container absolute -inset-4 rotate-3 rounded-3xl opacity-20 blur-2xl" />
            <div className="soft-glow-pink relative aspect-[1.79] overflow-hidden rounded-3xl">
              <Image
                src={content.storyImageUrl}
                alt={t("storyImageAlt")}
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="bg-primary absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-10 blur-3xl" />
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low px-gutter py-stack-lg">
        <div className="container-max gap-gutter grid grid-cols-1 md:grid-cols-2">
          <article className="bg-surface-container-lowest border-surface-container soft-glow-pink p-stack-md rounded-2xl border">
            <div className="bg-primary text-on-primary mb-stack-md flex h-12 w-12 items-center justify-center rounded-xl">
              <Heart className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="font-display text-headline-md text-primary mb-stack-sm">
              {t("missionTitle")}
            </h2>
            <p className="font-body text-body-md text-on-surface-variant">
              {content.missionBody}
            </p>
          </article>

          <article className="bg-surface-container-lowest border-surface-container soft-glow-turquoise p-stack-md rounded-2xl border">
            <div className="bg-secondary text-on-secondary mb-stack-md flex h-12 w-12 items-center justify-center rounded-xl">
              <Eye className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="font-display text-headline-md text-secondary mb-stack-sm">
              {t("visionTitle")}
            </h2>
            <p className="font-body text-body-md text-on-surface-variant">
              {content.visionBody}
            </p>
          </article>
        </div>
      </section>

      <section className="px-gutter py-stack-lg">
        <div className="container-max mb-stack-lg text-center">
          <h2 className="font-display text-display-lg-mobile text-on-surface">
            {t("valuesTitle")}
          </h2>
          <div className="bg-primary-container mx-auto mt-4 h-1.5 w-24 rounded-full" />
        </div>

        <div className="container-max gap-gutter grid grid-cols-1 text-center sm:grid-cols-3">
          {content.values.map((value) => {
            const Icon = VALUE_ICON[value.id];
            return (
              <div key={value.id} className="flex flex-col items-center">
                <div
                  className={`mb-stack-sm flex h-20 w-20 items-center justify-center rounded-full ${VALUE_ICON_WRAP[value.id]}`}
                >
                  <Icon className="h-10 w-10" aria-hidden />
                </div>
                <h3 className="font-label text-headline-md mb-2">
                  {value.title}
                </h3>
                <p className="font-body text-body-md text-on-surface-variant">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-gutter py-stack-lg">
        <div className="container-max bg-secondary-container p-stack-lg relative overflow-hidden rounded-3xl text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(var(--color-secondary) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
            aria-hidden
          />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="font-display text-display-lg-mobile text-on-secondary-container mb-stack-sm">
              {t("contactTitle")}
            </h2>
            <p className="font-body text-body-lg text-on-secondary-container mb-stack-md opacity-90">
              {t("contactSubtitle")}
            </p>

            <div className="gap-stack-sm flex flex-col items-center justify-center sm:flex-row">
              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="press-down soft-glow-pink bg-primary font-label text-label-bold text-on-primary inline-flex items-center gap-2 rounded-full px-8 py-4 transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                {t("whatsappCta")}
              </a>
            </div>

            <div className="mt-stack-md gap-stack-md flex justify-center">
              <a
                href={contact.tiktokHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("socialTiktok")}
                className="border-on-secondary-container/30 text-on-secondary-container hover:bg-secondary-fixed flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors"
              >
                <SocialIcon className="h-5 w-5" path={TIKTOK_PATH} />
              </a>
              <a
                href={contact.facebookHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("socialFacebook")}
                className="border-on-secondary-container/30 text-on-secondary-container hover:bg-secondary-fixed flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors"
              >
                <SocialIcon className="h-5 w-5" path={FACEBOOK_PATH} />
              </a>
              <a
                href={contact.emailHref}
                aria-label={t("socialEmail")}
                className="border-on-secondary-container/30 text-on-secondary-container hover:bg-secondary-fixed flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors"
              >
                <Mail className="h-5 w-5" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
