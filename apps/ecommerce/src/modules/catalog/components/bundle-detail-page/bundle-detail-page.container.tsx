"use client";

import type { BundleDetailPageLabels } from "./bundle-detail-page.types";
import type { PublicBundleDetail } from "@de-tin-marin/validations/public-catalog";
import { BundleDetailPage } from "./bundle-detail-page";

export type BundleDetailPageContainerProps = {
  bundle: PublicBundleDetail;
  labels: BundleDetailPageLabels;
};

export function BundleDetailPageContainer({
  bundle,
  labels,
}: BundleDetailPageContainerProps) {
  return (
    <BundleDetailPage
      bundle={bundle}
      labels={labels}
      personalizeHref={`/sorpresas/${bundle.id}/personalizar`}
    />
  );
}
