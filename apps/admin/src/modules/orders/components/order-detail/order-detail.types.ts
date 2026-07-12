import type { OrderStatus } from "@de-tin-marin/shared/order-cart";
import type { OrderDetail } from "@de-tin-marin/validations/order";
import type { ShipmentStatus } from "@de-tin-marin/validations/shipment";

export type OrderDetailLabels = {
  title: string;
  back: string;
  customer: string;
  delivery: string;
  pickupMethod: string;
  deliveryMethod: string;
  mapTitle: string;
  mapHint: string;
  mapUnavailable: string;
  summaryTitle: string;
  surpriseLine: string;
  formatQuantityLabel: (quantity: number) => string;
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

export const ORDER_STEPPER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "preparing",
  "ready",
  "delivered",
  "completed",
];
