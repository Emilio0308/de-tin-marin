import type { OrderStatus } from "@de-tin-marin/shared/order-cart";
import type { OrderDetail } from "@de-tin-marin/validations/order";
import type { ShipmentStatus } from "@de-tin-marin/validations/shipment";

export type OrderDetailLabels = {
  title: string;
  back: string;
  customer: string;
  delivery: string;
  cart: string;
  subtotal: string;
  discount: string;
  shipping: string;
  total: string;
  paymentStatus: string;
  paymentPanelTitle: string;
  paymentReference: string;
  paymentNotes: string;
  confirmPayment: string;
  confirmingPayment: string;
  paymentHistory: string;
  refundPayment: string;
  refundingPayment: string;
  noPayments: string;
  shipmentPanelTitle: string;
  shipmentStatus: string;
  shipmentTracking: string;
  shipmentCarrier: string;
  shipmentNotes: string;
  saveShipment: string;
  savingShipment: string;
  statusActionsTitle: string;
  cancelOrder: string;
  cancelling: string;
  cancelConfirm: string;
  referencePrefix: string;
  paymentReferencePlaceholder: string;
  statusLabels: Record<string, string>;
  paymentStatusLabels: Record<string, string>;
  shipmentStatusLabels: Record<string, string>;
};

export type OrderDetailViewProps = {
  order: OrderDetail;
  labels: OrderDetailLabels;
  paymentReference: string;
  paymentNotes: string;
  onPaymentReferenceChange: (value: string) => void;
  onPaymentNotesChange: (value: string) => void;
  onConfirmPayment?: () => void;
  confirmingPayment?: boolean;
  onRefundPayment?: (paymentId: string) => void;
  refundingPaymentId?: string | null;
  shipmentStatus: ShipmentStatus;
  shipmentTracking: string;
  shipmentCarrier: string;
  shipmentNotes: string;
  onShipmentStatusChange: (value: ShipmentStatus) => void;
  onShipmentTrackingChange: (value: string) => void;
  onShipmentCarrierChange: (value: string) => void;
  onShipmentNotesChange: (value: string) => void;
  onSaveShipment?: () => void;
  savingShipment?: boolean;
  nextStatuses: OrderStatus[];
  onTransitionStatus?: (status: OrderStatus) => void;
  transitioningTo?: OrderStatus | null;
  onCancel?: () => void;
  cancelling?: boolean;
};

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "pending",
  "shipped",
  "delivered",
];
