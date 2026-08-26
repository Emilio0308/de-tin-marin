export type HeroDisplayMode = "static" | "carousel";

export type HeroSettingsDTO = {
  displayMode: HeroDisplayMode;
};

export type HeroImageDTO = {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  startsAt: string;
  endsAt: string;
};
