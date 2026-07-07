import type { GuestOrderDetail } from "@de-tin-marin/validations/guest-order";

export type GuestOrderLineSummary = {
  key: string;
  name: string;
  detail: string;
  lineTotal: number;
};

export type GuestOrderDetailLabels = {
  subtotal: string;
  shipping: string;
  total: string;
  linesTitle: string;
  status: string;
  paymentStatus: string;
  deliveryTitle: string;
  pickupTitle: string;
  bundleComponents: string;
  formatBundlePersons: (count: number) => string;
  formatStatus: (status: string) => string;
  formatPaymentStatus: (paymentStatus: string) => string;
};

export type GuestOrderDetailProps = {
  order: GuestOrderDetail;
  labels: GuestOrderDetailLabels;
};

export type PaymentInstructionsLabels = {
  title: string;
  yape: string;
  transfer: string;
  note: string;
};

export type PaymentInstructionsProps = {
  labels: PaymentInstructionsLabels;
};
