import type { MapPin } from "@de-tin-marin/validations/checkout";
import type {
  CheckoutFieldErrors,
  CheckoutFormField,
  CheckoutFormValues,
  GuestCheckoutFulfillmentMethod,
} from "./checkout-form.helpers";

export type {
  CheckoutFormField,
  CheckoutFormValues,
  GuestCheckoutFulfillmentMethod,
};

export type CheckoutPageLabels = {
  title: string;
  subtitle: string;
  backToCart: string;
  summaryTitle: string;
  secureNote: string;
  contactTitle: string;
  fulfillmentTitle: string;
  fulfillmentDelivery: string;
  fulfillmentPickupPoint: string;
  addressTitle: string;
  pickupPointTitle: string;
  pickupPointPlaceholder: string;
  mapSectionTitle: string;
  pickupMapHint: string;
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
  mapSearchLabel: string;
  mapSearchPlaceholder: string;
  mapSearchNoResults: string;
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

export type CheckoutPickupPointOption = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  fee: number;
};

export type CheckoutPageProps = {
  form: CheckoutFormValues;
  fieldErrors: CheckoutFieldErrors;
  showValidationSummary: boolean;
  fulfillmentMethod: GuestCheckoutFulfillmentMethod;
  showPickupPointOption: boolean;
  pickupPointId: string;
  pickupPointError: string | null;
  pickupPoints: CheckoutPickupPointOption[];
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
  onFulfillmentMethodChange: (method: GuestCheckoutFulfillmentMethod) => void;
  onPickupPointChange: (pickupPointId: string) => void;
  onPickupPointBlur: () => void;
  onMapPinChange: (pin: MapPin) => void;
  onSubmit: () => void;
};
