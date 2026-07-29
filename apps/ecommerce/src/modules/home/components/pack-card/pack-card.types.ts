import type { HomePack } from "@/modules/home/types/home.types";

export type PackCardVariant = "listing" | "featured";

export interface PackCardProps {
  pack: HomePack;
  detailHref?: string;
  viewComboLabel?: string;
  priceLabel?: string;
  variant?: PackCardVariant;
}
