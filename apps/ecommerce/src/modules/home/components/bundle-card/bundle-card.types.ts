import type { HomeBundle } from "@/modules/home/types/home.types";

export type BundleCardVariant = "listing" | "featured";

export interface BundleCardProps {
  bundle: HomeBundle;
  detailHref?: string;
  personalizeLabel?: string;
  priceLabel?: string;
  variant?: BundleCardVariant;
}
