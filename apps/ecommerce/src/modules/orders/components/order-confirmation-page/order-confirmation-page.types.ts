import type { GuestOrderDetail } from "@de-tin-marin/validations/guest-order";
import type {
  GuestOrderDetailLabels,
  PaymentInstructionsLabels,
} from "../guest-order-detail/guest-order-detail.types";

export type OrderConfirmationPageLabels = {
  title: string;
  orderNumber: string;
  missingParams: string;
  loading: string;
  lookupLink: string;
  continueShopping: string;
  detail: GuestOrderDetailLabels;
  payment: PaymentInstructionsLabels;
};

export type OrderConfirmationPageProps = {
  orderNumber: string | null;
  email: string | null;
  order: GuestOrderDetail | null;
  isLoading: boolean;
  errorMessage: string | null;
  labels: OrderConfirmationPageLabels;
};
