"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { GuestOrderDetail } from "@de-tin-marin/validations/guest-order";
import { getGuestOrderAction } from "@/modules/orders/actions/get-guest-order";
import {
  GUEST_ORDER_STATUS_LABEL_KEYS,
  GUEST_PAYMENT_STATUS_LABEL_KEYS,
  resolveGuestOrderStatusLabel,
  resolveGuestPaymentStatusLabel,
} from "@/modules/orders/helpers/guest-order-status-labels";
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

  return (
    <GuestOrderLookupPage
      form={form}
      order={order}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      labels={{
        title: t("title"),
        subtitle: t("subtitle"),
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
          bundleComponents: tConfirmation("summary.bundleComponents"),
          formatBundlePersons: (count) =>
            tConfirmation("summary.bundlePersons", { count }),
          formatStatus: (status) =>
            resolveGuestOrderStatusLabel(status, statusLabels),
          formatPaymentStatus: (paymentStatus) =>
            resolveGuestPaymentStatusLabel(paymentStatus, paymentStatusLabels),
        },
        payment: {
          title: tConfirmation("paymentInstructions.title"),
          yape: tConfirmation("paymentInstructions.yape"),
          transfer: tConfirmation("paymentInstructions.transfer"),
          note: tConfirmation("paymentInstructions.note"),
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
