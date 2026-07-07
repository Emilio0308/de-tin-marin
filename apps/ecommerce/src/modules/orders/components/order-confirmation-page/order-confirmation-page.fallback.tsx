"use client";

import { useTranslations } from "next-intl";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";

export function OrderConfirmationPageFallback() {
  const t = useTranslations("common");

  return (
    <StorefrontLayout>
      <section className="container-max px-gutter py-section-lg">
        <p className="font-body text-body-md text-on-surface-variant text-center">
          {t("loading")}
        </p>
      </section>
    </StorefrontLayout>
  );
}
