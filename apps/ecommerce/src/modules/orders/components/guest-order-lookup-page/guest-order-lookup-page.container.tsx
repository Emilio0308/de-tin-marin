"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  buildGuestOrderLookupInitialForm,
  canSubmitGuestOrderLookup,
  shouldAutoLookupGuestOrder,
} from "./guest-order-lookup-page.helpers";
import { GuestOrderLookupPage } from "./guest-order-lookup-page";

export function GuestOrderLookupPageContainer() {
  const searchParams = useSearchParams();
  const t = useTranslations("guestOrderLookup");
  const tConfirmation = useTranslations("orderConfirmation");
  const [form, setForm] = useState(() =>
    buildGuestOrderLookupInitialForm({
      orderNumber: searchParams.get("orderNumber"),
      email: searchParams.get("email"),
    }),
  );
  const [order, setOrder] = useState<GuestOrderDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const businessSettingsQuery = useQuery({
    queryKey: queryKeys.businessSettings.public(),
    queryFn: async () => {
      const result = await getPublicBusinessSettingsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const autoLookupOnMount = useMemo(
    () =>
      shouldAutoLookupGuestOrder({
        orderNumber: searchParams.get("orderNumber"),
        email: searchParams.get("email"),
      }),
    [searchParams],
  );

  const lookupOrder = useCallback(
    async (orderNumber: string, email: string) => {
      if (!canSubmitGuestOrderLookup({ orderNumber, email })) return;

      setIsSubmitting(true);
      setErrorMessage(null);
      setOrder(null);

      const result = await getGuestOrderAction({
        orderNumber: orderNumber.trim(),
        email: email.trim(),
      });

      setIsSubmitting(false);

      if (!result.ok) {
        setErrorMessage(t("notFound"));
        return;
      }

      setOrder(result.data);
    },
    [t],
  );

  const autoLookupDoneRef = useRef(false);

  useEffect(() => {
    if (!autoLookupOnMount || autoLookupDoneRef.current) return;
    autoLookupDoneRef.current = true;

    const orderNumber = searchParams.get("orderNumber")?.trim() ?? "";
    const email = searchParams.get("email")?.trim() ?? "";
    void lookupOrder(orderNumber, email);
  }, [autoLookupOnMount, lookupOrder, searchParams]);

  const statusLabels = useMemo(
    () =>
      Object.fromEntries(
        GUEST_ORDER_STATUS_LABEL_KEYS.map((status) => [
          status,
          tConfirmation(`status.${status}`),
        ]),
      ),
    [tConfirmation],
  );

  const paymentStatusLabels = useMemo(
    () =>
      Object.fromEntries(
        GUEST_PAYMENT_STATUS_LABEL_KEYS.map((status) => [
          status,
          tConfirmation(`paymentStatus.${status}`),
        ]),
      ),
    [tConfirmation],
  );

  const paymentLabels = useMemo(() => {
    if (!businessSettingsQuery.data) return null;
    return buildPaymentInstructionLabels(
      (key, values) => tConfirmation(key, values),
      businessSettingsQuery.data,
    );
  }, [businessSettingsQuery.data, tConfirmation]);

  const orderForView =
    order && (order.status !== "pending_payment" || paymentLabels !== null)
      ? order
      : null;

  return (
    <GuestOrderLookupPage
      form={form}
      order={orderForView}
      isSubmitting={
        isSubmitting || (order?.status === "pending_payment" && !paymentLabels)
      }
      errorMessage={errorMessage}
      labels={{
        title: t("title"),
        subtitle: t("subtitle"),
        lookupTitle: t("lookupTitle"),
        lookupHint: t("lookupHint"),
        secureNote: t("secureNote"),
        orderNumber: t("orderNumber"),
        email: t("email"),
        submit: t("submit"),
        submitting: t("submitting"),
        detail: {
          subtotal: tConfirmation("summary.subtotal"),
          shipping: tConfirmation("summary.shipping"),
          total: tConfirmation("summary.total"),
          linesTitle: tConfirmation("summary.lines"),
          status: tConfirmation("summary.status"),
          paymentStatus: tConfirmation("summary.paymentStatus"),
          deliveryTitle: tConfirmation("summary.deliveryTitle"),
          pickupTitle: tConfirmation("summary.pickupTitle"),
          bundleBadge: tConfirmation("summary.bundleBadge"),
          packBadge: tConfirmation("summary.packBadge"),
          bundleComponents: tConfirmation("summary.bundleComponents"),
          packComponents: tConfirmation("summary.packComponents"),
          progressTitle: tConfirmation("summary.progressTitle"),
          orderPlaced: tConfirmation("summary.orderPlaced"),
          orderNumber: tConfirmation("summary.orderNumber"),
          dateLabel: tConfirmation("summary.dateLabel"),
          statusCurrent: tConfirmation("summary.statusCurrent"),
          paymentPendingHint: tConfirmation("summary.paymentPendingHint"),
          formatBundlePersons: (count) =>
            tConfirmation("summary.bundlePersons", { count }),
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
      onChange={(field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
      }}
      onSubmit={() => {
        void lookupOrder(form.orderNumber, form.email);
      }}
    />
  );
}
