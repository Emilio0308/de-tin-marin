"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getPublicHeroConfigAction } from "@/modules/home/actions/get-public-hero-config";
import { catalogQueryOptions } from "@/shared/query/query-cache";
import { queryKeys } from "@/shared/query/query-keys";
import { HeroSection } from "./hero-section";
import { resolveHeroSlides, type HeroSlideView } from "./hero-section.helpers";

export function HeroSectionContainer() {
  const t = useTranslations("home.hero");

  const heroQuery = useQuery({
    ...catalogQueryOptions,
    queryKey: queryKeys.home.hero(),
    queryFn: async () => {
      const result = await getPublicHeroConfigAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    retry: 1,
  });

  const slides: HeroSlideView[] = resolveHeroSlides({
    slides: heroQuery.data?.slides,
    error: heroQuery.isError,
  });

  const displayMode =
    heroQuery.data?.displayMode === "carousel" ? "carousel" : "static";

  return (
    <HeroSection
      titlePrefix={t("titlePrefix")}
      titleHighlight={t("titleHighlight")}
      description={t("description")}
      ctaSurprises={t("ctaSurprises")}
      ctaProducts={t("ctaProducts")}
      imageAlt={t("imageAlt")}
      favoriteKit={t("favoriteKit")}
      displayMode={displayMode}
      slides={slides}
      prevLabel={t("carouselPrev")}
      nextLabel={t("carouselNext")}
    />
  );
}
