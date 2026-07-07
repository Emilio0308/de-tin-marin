import type { HomeBundle } from "@/modules/home/types/home.types";

export interface BundleCardProps {
  bundle: HomeBundle;
  detailHref?: string;
  personalizeLabel?: string;
}
