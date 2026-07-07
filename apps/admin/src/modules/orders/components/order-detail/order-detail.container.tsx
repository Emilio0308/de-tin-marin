"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  canTransitionOrderStatus,
  ORDER_STATUSES,
  type OrderStatus,
} from "@de-tin-marin/shared/order-cart";
import type { ShipmentStatus } from "@de-tin-marin/validations/shipment";
import { cancelOrderAction } from "@/modules/orders/actions/cancel-order";
import { confirmPaymentAction } from "@/modules/orders/actions/confirm-payment";
import { getOrderAction } from "@/modules/orders/actions/get-order";
import { refundPaymentAction } from "@/modules/orders/actions/refund-payment";
import { transitionOrderStatusAction } from "@/modules/orders/actions/transition-order-status";
import { upsertShipmentAction } from "@/modules/orders/actions/upsert-shipment";
import { OrderDetailView } from "./order-detail";
import type { OrderDetailLabels } from "./order-detail.types";

const LOGISTIC_STATUSES: OrderStatus[] = [
  "preparing",
  "ready",
  "delivered",
  "completed",
];

function buildNextStatuses(current: OrderStatus): OrderStatus[] {
  return LOGISTIC_STATUSES.filter((status) =>
    canTransitionOrderStatus(current, status),
  );
}

export function OrderDetailContainer() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard.orderStatus");

  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [shipmentStatus, setShipmentStatus] =
    useState<ShipmentStatus>("pending");
  const [shipmentTracking, setShipmentTracking] = useState("");
  const [shipmentCarrier, setShipmentCarrier] = useState("");
  const [shipmentNotes, setShipmentNotes] = useState("");
  const [transitioningTo, setTransitioningTo] = useState<OrderStatus | null>(
    null,
  );
  const [refundingPaymentId, setRefundingPaymentId] = useState<string | null>(
    null,
  );

  const labels = useMemo<OrderDetailLabels>(() => {
    const statusLabels = Object.fromEntries(
      ORDER_STATUSES.map((status) => [status, tDashboard(status)]),
    );
    return {
      title: t("detail.title"),
      back: t("detail.back"),
      customer: t("detail.customer"),
      delivery: t("detail.delivery"),
      cart: t("detail.cart"),
      subtotal: t("detail.subtotal"),
      discount: t("detail.discount"),
      shipping: t("detail.shipping"),
      total: t("detail.total"),
      paymentStatus: t("detail.paymentStatusLabel"),
      paymentPanelTitle: t("detail.paymentPanelTitle"),
      paymentReference: t("detail.paymentReference"),
      paymentNotes: t("detail.paymentNotes"),
      confirmPayment: t("detail.confirmPayment"),
      confirmingPayment: t("detail.confirmingPayment"),
      paymentHistory: t("detail.paymentHistory"),
      refundPayment: t("detail.refundPayment"),
      refundingPayment: t("detail.refundingPayment"),
      noPayments: t("detail.noPayments"),
      shipmentPanelTitle: t("detail.shipmentPanelTitle"),
      shipmentStatus: t("detail.shipmentStatus"),
      shipmentTracking: t("detail.shipmentTracking"),
      shipmentCarrier: t("detail.shipmentCarrier"),
      shipmentNotes: t("detail.shipmentNotes"),
      saveShipment: t("detail.saveShipment"),
      savingShipment: t("detail.savingShipment"),
      statusActionsTitle: t("detail.statusActionsTitle"),
      cancelOrder: t("detail.cancelOrder"),
      cancelling: t("detail.cancelling"),
      cancelConfirm: t("detail.cancelConfirm"),
      referencePrefix: t("detail.referencePrefix"),
      paymentReferencePlaceholder: t("detail.paymentReferencePlaceholder"),
      statusLabels,
      paymentStatusLabels: {
        pending: t("paymentStatus.pending"),
        confirmed: t("paymentStatus.confirmed"),
        refunded: t("paymentStatus.refunded"),
      },
      shipmentStatusLabels: {
        pending: t("shipmentStatus.pending"),
        shipped: t("shipmentStatus.shipped"),
        delivered: t("shipmentStatus.delivered"),
      },
      stockWarningTitle: t("detail.stockWarningTitle"),
      stockWarningItem: t("detail.stockWarningItem"),
      insufficientStockError: t("detail.insufficientStockError"),
    };
  }, [t, tDashboard]);

  const orderQuery = useQuery({
    queryKey: ["orders", params.id],
    queryFn: async () => {
      const result = await getOrderAction(params.id);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });

  useEffect(() => {
    const shipment = orderQuery.data?.shipment;
    if (!shipment) return;
    setShipmentStatus(shipment.status);
    setShipmentTracking(shipment.trackingNumber ?? "");
    setShipmentCarrier(shipment.carrier ?? "");
    setShipmentNotes(shipment.notes ?? "");
  }, [orderQuery.data?.shipment]);

  const invalidateOrder = async () => {
    await queryClient.invalidateQueries({ queryKey: ["orders"] });
    await queryClient.invalidateQueries({ queryKey: ["orders", params.id] });
  };

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const result = await cancelOrderAction(params.id);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: invalidateOrder,
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      const result = await confirmPaymentAction({
        orderId: params.id,
        paymentReference: paymentReference || undefined,
        notes: paymentNotes || undefined,
      });
      if (!result.ok) {
        if (result.error === "INSUFFICIENT_STOCK") {
          const sku = result.details?.sku;
          throw new Error(
            sku
              ? `${labels.insufficientStockError} (${sku})`
              : labels.insufficientStockError,
          );
        }
        throw new Error(result.error);
      }
    },
    onSuccess: async () => {
      setPaymentReference("");
      setPaymentNotes("");
      await invalidateOrder();
    },
  });

  const refundPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      setRefundingPaymentId(paymentId);
      const result = await refundPaymentAction({ paymentId });
      if (!result.ok) throw new Error(result.error);
    },
    onSettled: () => setRefundingPaymentId(null),
    onSuccess: invalidateOrder,
  });

  const transitionMutation = useMutation({
    mutationFn: async (status: OrderStatus) => {
      setTransitioningTo(status);
      const result = await transitionOrderStatusAction({
        id: params.id,
        status,
      });
      if (!result.ok) throw new Error(result.error);
    },
    onSettled: () => setTransitioningTo(null),
    onSuccess: invalidateOrder,
  });

  const shipmentMutation = useMutation({
    mutationFn: async () => {
      const result = await upsertShipmentAction({
        orderId: params.id,
        status: shipmentStatus,
        trackingNumber: shipmentTracking || null,
        carrier: shipmentCarrier || null,
        notes: shipmentNotes || null,
      });
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: invalidateOrder,
  });

  function handleCancel() {
    if (!window.confirm(labels.cancelConfirm)) return;
    cancelMutation.mutate();
  }

  if (orderQuery.isLoading) {
    return (
      <p className="text-on-surface-variant p-8 text-sm">
        {tCommon("loading")}
      </p>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="p-8">
        <p className="text-error text-sm">{t("detail.loadError")}</p>
        <button
          type="button"
          className="text-primary mt-4 text-sm underline"
          onClick={() => router.push("/orders")}
        >
          {labels.back}
        </button>
      </div>
    );
  }

  const order = orderQuery.data;
  const nextStatuses = buildNextStatuses(order.status as OrderStatus);

  return (
    <div className="p-8">
      <OrderDetailView
        order={order}
        labels={labels}
        paymentReference={paymentReference}
        paymentNotes={paymentNotes}
        onPaymentReferenceChange={setPaymentReference}
        onPaymentNotesChange={setPaymentNotes}
        onConfirmPayment={() => confirmPaymentMutation.mutate()}
        confirmingPayment={confirmPaymentMutation.isPending}
        onRefundPayment={(paymentId) => refundPaymentMutation.mutate(paymentId)}
        refundingPaymentId={refundingPaymentId}
        shipmentStatus={shipmentStatus}
        shipmentTracking={shipmentTracking}
        shipmentCarrier={shipmentCarrier}
        shipmentNotes={shipmentNotes}
        onShipmentStatusChange={setShipmentStatus}
        onShipmentTrackingChange={setShipmentTracking}
        onShipmentCarrierChange={setShipmentCarrier}
        onShipmentNotesChange={setShipmentNotes}
        onSaveShipment={() => shipmentMutation.mutate()}
        savingShipment={shipmentMutation.isPending}
        nextStatuses={nextStatuses}
        onTransitionStatus={(status) => transitionMutation.mutate(status)}
        transitioningTo={transitioningTo}
        onCancel={handleCancel}
        cancelling={cancelMutation.isPending}
      />
    </div>
  );
}
