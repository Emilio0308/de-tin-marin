"use client";

import { useTranslations } from "next-intl";
import { HeroSection } from "./hero-section";

export function HeroSectionContainer() {
  const t = useTranslations("home.hero");

  return (
    <HeroSection
      titlePrefix={t("titlePrefix")}
      titleHighlight={t("titleHighlight")}
      description={t("description")}
      ctaSurprises={t("ctaSurprises")}
      ctaProducts={t("ctaProducts")}
      imageAlt={t("imageAlt")}
      favoriteKit={t("favoriteKit")}
    />
  );
}
