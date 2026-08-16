import type { MapPin } from "@de-tin-marin/validations/checkout";
import type {
  CheckoutFieldErrors,
  CheckoutFormField,
  CheckoutFormValues,
} from "./checkout-form.helpers";

export type { CheckoutFormField, CheckoutFormValues };

export type CheckoutPageLabels = {
  title: string;
  subtitle: string;
  backToCart: string;
  summaryTitle: string;
  secureNote: string;
  contactTitle: string;
  addressTitle: string;
  mapSectionTitle: string;
  name: string;
  lastName: string;
  phone: string;
  email: string;
  line1: string;
  district: string;
  districtPlaceholder: string;
  city: string;
  province: string;
  reference: string;
  referenceHint: string;
  requiredHint: string;
  mapTitle: string;
  mapHint: string;
  phoneHint: string;
  subtotal: string;
  shipping: string;
  shippingPending: string;
  total: string;
  submit: string;
  submitting: string;
  outOfCoverage: string;
  stockTitle: string;
  stockChecking: string;
  emptyCart: string;
  validationSummary: string;
  stepsLabel: string;
  stepCart: string;
  stepCheckout: string;
  stepDone: string;
  validation: {
    required: string;
    invalidEmail: string;
    invalidName: string;
    invalidPhone: string;
    tooShort: string;
  };
};

export type CheckoutDistrictOption = {
  id: string;
  district: string;
  fee: number;
};

export type CheckoutPageProps = {
  form: CheckoutFormValues;
  fieldErrors: CheckoutFieldErrors;
  showValidationSummary: boolean;
  districts: CheckoutDistrictOption[];
  mapPin: MapPin;
  subtotal: number;
  shippingTotal: number;
  total: number;
  covered: boolean;
  isDeliveryPending: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  stockBlocked: boolean;
  isStockPending: boolean;
  stockWarning: boolean;
  stockMessages: string[];
  labels: CheckoutPageLabels;
  onChange: (field: CheckoutFormField, value: string) => void;
  onFieldBlur: (field: CheckoutFormField, values: CheckoutFormValues) => void;
  onMapPinChange: (pin: MapPin) => void;
  onSubmit: () => void;
};
