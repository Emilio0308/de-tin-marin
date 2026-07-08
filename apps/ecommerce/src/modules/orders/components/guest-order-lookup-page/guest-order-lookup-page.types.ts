import type { GuestOrderDetail } from "@de-tin-marin/validations/guest-order";
import type {
  GuestOrderDetailLabels,
  PaymentInstructionsLabels,
} from "../guest-order-detail/guest-order-detail.types";

export type GuestOrderLookupPageProps = {
  form: {
    orderNumber: string;
    email: string;
  };
  order: GuestOrderDetail | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  labels: {
    title: string;
    subtitle: string;
    orderNumber: string;
    email: string;
    submit: string;
    submitting: string;
    detail: GuestOrderDetailLabels;
    payment: PaymentInstructionsLabels;
  };
  onChange: (field: "orderNumber" | "email", value: string) => void;
  onSubmit: () => void;
};
