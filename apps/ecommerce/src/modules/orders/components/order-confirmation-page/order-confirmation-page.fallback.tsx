"use client";

import { useTranslations } from "next-intl";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { OrderConfirmationSuccessIcon } from "../guest-order-detail/guest-order-detail";

export function OrderConfirmationPageFallback() {
  const t = useTranslations("common");
  const tConfirmation = useTranslations("orderConfirmation");

  return (
    <StorefrontLayout>
      <section className="bg-tertiary/5 pt-stack-md md:pt-stack-lg pb-section-lg">
        <div className="container-max px-gutter">
          <div className="space-y-stack-md mx-auto max-w-3xl text-center">
            <OrderConfirmationSuccessIcon />
            <h1 className="font-display text-display-lg-mobile text-primary md:text-display-lg">
              {tConfirmation("title")}
            </h1>
            <p className="font-body text-body-md text-on-surface-variant">
              {t("loading")}
            </p>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
