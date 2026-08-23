import type { OrderStatus } from "@de-tin-marin/shared/order-cart";
import type { OrderFulfillmentMethod } from "@de-tin-marin/shared/delivery-fee";
import type { OrderDetail } from "@de-tin-marin/validations/order";
import type { ShipmentStatus } from "@de-tin-marin/validations/shipment";

export type TransitionShipmentInput = {
  carrier: string;
  trackingNumber: string;
  notes?: string | null;
};

export type OrderDetailLabels = {
  title: string;
  back: string;
  customer: string;
  delivery: string;
  pickupMethod: string;
  pickupPointMethod: string;
  deliveryMethod: string;
  mapTitle: string;
  mapHint: string;
  mapUnavailable: string;
  summaryTitle: string;
  surpriseLine: string;
  formatQuantityLabel: (quantity: number) => string;
  formatProductDualQty: (packages: number, units: number) => string;
  formatComponentsLabel: (count: number) => string;
  componentSku: string;
  componentName: string;
  componentPrice: string;
  componentQuantity: string;
  taxesIncluded: string;
  stockWarningBanner: string;
  cart: string;
  subtotal: string;
  discount: string;
  surcharge: string;
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
  shipmentRequiredHint: string;
  statusActionsTitle: string;
  cancelOrder: string;
  cancelling: string;
  cancelConfirm: string;
  cancelConfirmPaid: string;
  referencePrefix: string;
  paymentReferencePlaceholder: string;
  statusLabels: Record<string, string>;
  paymentStatusLabels: Record<string, string>;
  shipmentStatusLabels: Record<string, string>;
  stepperLabels: Record<string, string>;
  stockWarningTitle: string;
  formatStockWarningItem: (params: {
    sku: string;
    required: number;
    available: number;
  }) => string;
  insufficientStockError: string;
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
  onTransitionStatus?: (
    status: OrderStatus,
    shipment?: TransitionShipmentInput,
  ) => void;
  transitioningTo?: OrderStatus | null;
  onCancel?: () => void;
  cancelling?: boolean;
};

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "pending",
  "shipped",
  "delivered",
];

export function buildOrderStepperStatuses(
  method: OrderFulfillmentMethod,
): OrderStatus[] {
  const logistic: OrderStatus =
    method === "pickup" ? "awaiting_pickup" : "in_transit";
  return [
    "pending_payment",
    "paid",
    "preparing",
    "ready",
    logistic,
    "delivered",
    "completed",
  ];
}

export function orderNeedsShipmentForTransit(
  method: OrderFulfillmentMethod,
): boolean {
  return method === "delivery" || method === "pickup_point";
}

export function showShipmentPanel(
  status: OrderStatus,
  method: OrderFulfillmentMethod,
): boolean {
  if (!orderNeedsShipmentForTransit(method)) return false;
  return status === "in_transit";
}
