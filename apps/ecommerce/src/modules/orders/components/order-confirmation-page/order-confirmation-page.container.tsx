"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { GuestOrderDetail } from "@de-tin-marin/validations/guest-order";
import { getPublicBusinessSettingsAction } from "@/modules/business-settings/actions/get-public-business-settings";
import { getGuestOrderAction } from "@/modules/orders/actions/get-guest-order";
import { buildPaymentInstructionLabels } from "@/modules/orders/helpers/build-payment-instruction-labels";
import {
  GUEST_ORDER_STATUS_LABEL_KEYS,
  GUEST_PAYMENT_STATUS_LABEL_KEYS,
  resolveGuestOrderStatusLabel,
  resolveGuestPaymentStatusLabel,
} from "@/modules/orders/helpers/guest-order-status-labels";
import { queryKeys } from "@/shared/query/query-keys";
import {
  hasConfirmationLookupParams,
  resolveConfirmationLookupParams,
} from "./order-confirmation-page.helpers";
import { OrderConfirmationPage } from "./order-confirmation-page";

export function OrderConfirmationPageContainer() {
  const searchParams = useSearchParams();
  const t = useTranslations("orderConfirmation");
  const tCommon = useTranslations("common");
  const tLookup = useTranslations("guestOrderLookup");

  const { orderNumber, email } = resolveConfirmationLookupParams(
    searchParams.get("orderNumber"),
    searchParams.get("email"),
  );
  const canLookup = hasConfirmationLookupParams(orderNumber, email);

  const [order, setOrder] = useState<GuestOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(canLookup);
  const [lookupFailed, setLookupFailed] = useState(false);

  const businessSettingsQuery = useQuery({
    queryKey: queryKeys.businessSettings.public(),
    queryFn: async () => {
      const result = await getPublicBusinessSettingsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!canLookup || !orderNumber || !email) {
      setOrder(null);
      setLookupFailed(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setLookupFailed(false);

    void (async () => {
      const result = await getGuestOrderAction({ orderNumber, email });
      if (cancelled) return;

      if (!result.ok) {
        setIsLoading(false);
        setLookupFailed(true);
        setOrder(null);
        return;
      }

      setOrder(result.data);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [canLookup, email, orderNumber]);

  const statusLabels = useMemo(
    () =>
      Object.fromEntries(
        GUEST_ORDER_STATUS_LABEL_KEYS.map((status) => [
          status,
          t(`status.${status}`),
        ]),
      ),
    [t],
  );

  const paymentStatusLabels = useMemo(
    () =>
      Object.fromEntries(
        GUEST_PAYMENT_STATUS_LABEL_KEYS.map((status) => [
          status,
          t(`paymentStatus.${status}`),
        ]),
      ),
    [t],
  );

  const paymentLabels = useMemo(() => {
    if (!businessSettingsQuery.data) return null;
    return buildPaymentInstructionLabels(
      (key, values) => t(key, values),
      businessSettingsQuery.data,
    );
  }, [businessSettingsQuery.data, t]);

  const errorMessage = lookupFailed ? tLookup("notFound") : null;
  const waitingPaymentLabels =
    order?.status === "pending_payment" && !paymentLabels;

  return (
    <OrderConfirmationPage
      orderNumber={orderNumber}
      email={email}
      order={order}
      isLoading={isLoading || waitingPaymentLabels}
      errorMessage={errorMessage}
      labels={{
        title: t("title"),
        orderNumber: orderNumber
          ? t("orderNumber", { orderNumber })
          : t("missingOrderNumber"),
        missingParams: t("missingParams"),
        loading: tCommon("loading"),
        lookupLink: t("lookupLink"),
        continueShopping: t("continueShopping"),
        detail: {
          subtotal: t("summary.subtotal"),
          shipping: t("summary.shipping"),
          total: t("summary.total"),
          linesTitle: t("summary.lines"),
          status: t("summary.status"),
          paymentStatus: t("summary.paymentStatus"),
          deliveryTitle: t("summary.deliveryTitle"),
          pickupTitle: t("summary.pickupTitle"),
          pickupPointTitle: t("summary.pickupPointTitle"),
          pickupInStoreNote: t("summary.pickupInStoreNote"),
          bundleBadge: t("summary.bundleBadge"),
          packBadge: t("summary.packBadge"),
          bundleComponents: t("summary.bundleComponents"),
          packComponents: t("summary.packComponents"),
          progressTitle: t("summary.progressTitle"),
          orderPlaced: t("summary.orderPlaced"),
          orderNumber: t("summary.orderNumber"),
          dateLabel: t("summary.dateLabel"),
          statusCurrent: t("summary.statusCurrent"),
          paymentPendingHint: t("summary.paymentPendingHint"),
          formatBundlePersons: (count) => t("summary.bundlePersons", { count }),
          formatStatus: (status) =>
            resolveGuestOrderStatusLabel(status, statusLabels),
          formatPaymentStatus: (paymentStatus) =>
            resolveGuestPaymentStatusLabel(paymentStatus, paymentStatusLabels),
        },
        payment: paymentLabels ?? {
          title: "",
          yapeLabel: "",
          transferLabel: "",
          yape: "",
          transfer: "",
          note: "",
        },
      }}
    />
  );
}
