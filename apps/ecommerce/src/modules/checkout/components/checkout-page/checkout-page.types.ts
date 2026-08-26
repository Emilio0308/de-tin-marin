import type { MapPin } from "@de-tin-marin/validations/checkout";
import type {
  CheckoutFieldErrors,
  CheckoutFormField,
  CheckoutFormValues,
  CourierFieldErrors,
  CourierFormField,
  CourierFormValues,
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
  fulfillmentCourier: string;
  courierTitle: string;
  courierDepartment: string;
  courierDepartmentPlaceholder: string;
  courierProvince: string;
  courierProvincePlaceholder: string;
  courierDni: string;
  courierFullName: string;
  courierAgencyAddress: string;
  courierFeeNote: string;
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
  shippingFree: string;
  shippingPending: string;
  shippingPromoNote: string;
  announcementLabel: string;
  minOrderHint: string;
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
    invalidDni: string;
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

export type CheckoutCourierDepartmentOption = {
  id: string;
  name: string;
  provinces: Array<{ slug: string; name: string }>;
};

export type CheckoutPageProps = {
  form: CheckoutFormValues;
  courierForm: CourierFormValues;
  fieldErrors: CheckoutFieldErrors;
  courierFieldErrors: CourierFieldErrors;
  showValidationSummary: boolean;
  fulfillmentMethod: GuestCheckoutFulfillmentMethod;
  showFulfillmentSelector: boolean;
  showPickupPointOption: boolean;
  showCourierOption: boolean;
  pickupPointId: string;
  pickupPointError: string | null;
  pickupPoints: CheckoutPickupPointOption[];
  courierDepartments: CheckoutCourierDepartmentOption[];
  districts: CheckoutDistrictOption[];
  mapPin: MapPin;
  subtotal: number;
  shippingTotal: number;
  shippingIsPromotional: boolean;
  announcementMessage: string | null;
  minOrderSubtotal: number;
  total: number;
  covered: boolean;
  isDeliveryPending: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  isStockPending: boolean;
  stockWarning: boolean;
  stockMessages: string[];
  labels: CheckoutPageLabels;
  onChange: (field: CheckoutFormField, value: string) => void;
  onCourierChange: (field: CourierFormField, value: string) => void;
  onFieldBlur: (field: CheckoutFormField, values: CheckoutFormValues) => void;
  onCourierFieldBlur: (values: CourierFormValues) => void;
  onFulfillmentMethodChange: (method: GuestCheckoutFulfillmentMethod) => void;
  onPickupPointChange: (pickupPointId: string) => void;
  onPickupPointBlur: () => void;
  onMapPinChange: (pin: MapPin) => void;
  onSubmit: () => void;
};
