/** Fallback hero image — same asset as pre-S4-03 hardcoded URL. */
export const FALLBACK_HERO_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDc5FMBIxWj0PpOIyY67f8C27ZZ-i2I6SgndhcTSAJr-8b8gaRw4PssOD6J-X2x58UnXFF9b-TIBChWEnLfaaLTpH_Xd6Jp1eu0tREtPJKbIuDZoIy3ZmQ6NG0EcwbR_jlz5AqydaCCtyUxuTCceTHl_SxfnSE2iTm6txCVV7PUKbcO3H2lcqeaKRQW-lpa3d5mMjQ20h0cyxd6kEac3yvY4BNbC_58r2Bxrb5b_4HdWQ_ZalJj9TsT91gklkrpjo79Ft9Xusxf-kc";

export type HeroSlideView = {
  imageUrl: string;
  altText: string | null;
};

export function resolveHeroSlides(input: {
  slides: HeroSlideView[] | undefined;
  error: boolean;
}): HeroSlideView[] {
  if (input.error || !input.slides || input.slides.length === 0) {
    return [{ imageUrl: FALLBACK_HERO_IMAGE_URL, altText: null }];
  }
  return input.slides;
}

export function shouldUseCarousel(
  displayMode: "static" | "carousel" | undefined,
  slideCount: number,
): boolean {
  return displayMode === "carousel" && slideCount > 1;
}
