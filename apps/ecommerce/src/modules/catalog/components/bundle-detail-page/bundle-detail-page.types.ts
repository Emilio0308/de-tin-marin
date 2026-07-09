import type { PublicBundleDetail } from "@de-tin-marin/validations/public-catalog";

export type BundleDetailPageLabels = {
  back: string;
  container: string;
  quantity: string;
  personCount: string;
  items: string;
  personalize: string;
  description: string;
};

export type BundleDetailPageProps = {
  bundle: PublicBundleDetail;
  labels: BundleDetailPageLabels;
  personalizeHref: string;
};
