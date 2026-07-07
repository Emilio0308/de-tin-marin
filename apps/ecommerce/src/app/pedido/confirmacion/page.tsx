import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { getTranslations } from "next-intl/server";

type OrderConfirmationRouteProps = {
  searchParams: Promise<{ orderNumber?: string }>;
};

export default async function OrderConfirmationRoute({
  searchParams,
}: OrderConfirmationRouteProps) {
  const { orderNumber } = await searchParams;
  const t = await getTranslations("orderConfirmation");

  return (
    <StorefrontLayout>
      <section className="container-max px-gutter py-section-lg text-center">
        <h1 className="font-display text-display-md-mobile text-on-surface md:text-display-md mb-4">
          {t("title")}
        </h1>
        {orderNumber ? (
          <>
            <p className="font-body text-body-lg text-on-surface mb-2">
              {t("orderNumber", { orderNumber })}
            </p>
            <p className="font-body text-body-md text-on-surface-variant">
              {t("pendingPayment")}
            </p>
          </>
        ) : (
          <p className="font-body text-body-md text-on-surface-variant">
            {t("missingOrderNumber")}
          </p>
        )}
      </section>
    </StorefrontLayout>
  );
}
