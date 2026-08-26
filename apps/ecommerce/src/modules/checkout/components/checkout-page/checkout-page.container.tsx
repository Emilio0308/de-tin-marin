"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { storeFeatures } from "@/config/store";
import { cartLinesToOrderInput } from "@/modules/cart/helpers/cart-to-order-input";
import { toShoppingCartLines } from "@/modules/cart/helpers/cart-lines";
import { writeCartSyncPayload } from "@/modules/cart/helpers/cart-sync";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { useCartPricingPreview } from "@/modules/cart/hooks/use-cart-pricing-preview";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { createGuestOrderAction } from "@/modules/checkout/actions/create-guest-order";
import { listCheckoutDeliveryZonesAction } from "@/modules/checkout/actions/list-checkout-delivery-zones";
import { listCheckoutPickupPointsAction } from "@/modules/checkout/actions/list-checkout-pickup-points";
import { listCheckoutCourierDestinationsAction } from "@/modules/checkout/actions/list-checkout-courier-destinations";
import { resolveCheckoutDeliveryFeeAction } from "@/modules/checkout/actions/resolve-checkout-delivery-fee";
import { validateGuestCheckoutCartAction } from "@/modules/checkout/actions/validate-guest-checkout-cart";
import { queryKeys } from "@/shared/query/query-keys";
import { freshQueryOptions } from "@/shared/query/query-cache";
import { logClientError } from "@/shared/errors/client-error";
import type { MapPin } from "@de-tin-marin/validations/checkout";
import { defaultMapPin } from "../delivery-map/delivery-map.constants";
import {
  getCheckoutFieldErrorKey,
  getCheckoutFieldErrorKeys,
  getCourierFieldErrorKeys,
  getCheckoutFieldSection,
  getFirstInvalidCheckoutField,
  getPickupPointErrorKey,
  hasCheckoutFieldError,
  mapCheckoutFieldError,
  mapCheckoutFieldErrors,
  mapCourierFieldErrors,
  sanitizeCheckoutField,
  sanitizeCourierField,
  scrollToCheckoutField,
  type CheckoutFieldErrorKey,
  type CheckoutFieldErrors,
  type CheckoutFormField,
  type CheckoutFormValues,
  type CourierFieldErrors,
  type CourierFormValues,
  type GuestCheckoutFulfillmentMethod,
} from "./checkout-form.helpers";
import { CheckoutPage } from "./checkout-page";

type GuestOrderErrorCode =
  | "OUT_OF_COVERAGE"
  | "INSUFFICIENT_STOCK"
  | "INVALID_PURCHASE_QUANTITY"
  | "INVALID_BUNDLE_CUSTOMIZATION"
  | "VALIDATION"
  | "PRODUCT_NOT_FOUND"
  | "BUNDLE_NOT_FOUND"
  | "PACK_NOT_FOUND"
  | "DUPLICATE_PRODUCT_IN_BUNDLE"
  | "PICKUP_POINT_NOT_FOUND"
  | "PICKUP_POINT_INACTIVE"
  | "PICKUP_POINT_REQUIRED"
  | "SHIPPING_FEE_MISMATCH"
  | "UNEXPECTED";

const initialForm: CheckoutFormValues = {
  name: "",
  lastName: "",
  phone: "",
  email: "",
  line1: "",
  district: "",
  city: "Piura",
  province: "Piura",
  reference: "",
};

const initialCourierForm: CourierFormValues = {
  courierDepartmentId: "",
  courierProvinceSlug: "",
  courierDni: "",
  courierFullName: "",
  courierAgencyAddress: "",
};

export function CheckoutPageContainer() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const { lines, totals, clear, isReady } = useCart();
  const {
    subtotal: previewSubtotal,
    isPricingPending,
    isPricingError,
  } = useCartPricingPreview(lines);
  const subtotal = previewSubtotal ?? totals.subtotal ?? 0;
  const [form, setForm] = useState(initialForm);
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<GuestCheckoutFulfillmentMethod>("delivery");
  const [pickupPointId, setPickupPointId] = useState("");
  const [pickupPointError, setPickupPointError] = useState<string | null>(null);
  const [pickupPointTouched, setPickupPointTouched] = useState(false);
  const [mapPin, setMapPin] = useState<MapPin>(defaultMapPin);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const orderPlacedRef = useRef(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [courierForm, setCourierForm] =
    useState<CourierFormValues>(initialCourierForm);
  const [courierFieldErrors, setCourierFieldErrors] =
    useState<CourierFieldErrors>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<CheckoutFormField, boolean>>
  >({});

  const courierFieldLabels = useMemo(
    () => ({
      courierDepartmentId: t("courierDepartment"),
      courierProvinceSlug: t("courierProvince"),
      courierDni: t("courierDni"),
      courierFullName: t("courierFullName"),
      courierAgencyAddress: t("courierAgencyAddress"),
    }),
    [t],
  );

  const validationLabels = useMemo(
    () => ({
      required: t("validation.required"),
      invalidEmail: t("validation.invalidEmail"),
      invalidName: t("validation.invalidName"),
      invalidPhone: t("validation.invalidPhone"),
      invalidDni: t("validation.invalidDni"),
      tooShort: t("validation.tooShort"),
    }),
    [t],
  );

  const shouldValidateLive = useCallback(
    (field: CheckoutFormField) =>
      hasAttemptedSubmit ||
      Boolean(touchedFields[field]) ||
      hasCheckoutFieldError(fieldErrors, field),
    [fieldErrors, hasAttemptedSubmit, touchedFields],
  );

  const validatePickupPoint = useCallback(
    (value: string) => {
      const errorKey = getPickupPointErrorKey(value);
      const message = errorKey ? validationLabels[errorKey] : null;
      setPickupPointError(message);
      return !errorKey;
    },
    [validationLabels],
  );

  const fieldSectionLabel = useCallback(
    (field: CheckoutFormField | "pickupPointId") => {
      if (field === "pickupPointId") {
        return t("validation.pickupSection");
      }
      return getCheckoutFieldSection(field) === "contact"
        ? t("validation.contactSection")
        : t("validation.addressSection");
    },
    [t],
  );

  const fieldDisplayLabel = useCallback(
    (field: CheckoutFormField | "pickupPointId") => {
      if (field === "pickupPointId") return t("pickupPointTitle");
      return t(field);
    },
    [t],
  );

  const toastForFieldIssue = useCallback(
    (
      field: CheckoutFormField | "pickupPointId",
      errorKey: CheckoutFieldErrorKey | "required",
    ) => {
      const params = {
        field: fieldDisplayLabel(field),
        section: fieldSectionLabel(field),
      };
      const message =
        errorKey === "required"
          ? t("validation.missingFieldToast", params)
          : t("validation.invalidFieldToast", params);
      toast.error(message);
      scrollToCheckoutField(field);
    },
    [fieldDisplayLabel, fieldSectionLabel, t],
  );

  const validateForm = useCallback(
    (values: CheckoutFormValues, method: GuestCheckoutFulfillmentMethod) => {
      const errorKeys = getCheckoutFieldErrorKeys(values, method);
      const mappedErrors = mapCheckoutFieldErrors(errorKeys, validationLabels);
      setFieldErrors(mappedErrors);

      const firstInvalid = getFirstInvalidCheckoutField(errorKeys);
      if (firstInvalid) {
        setShowValidationSummary(true);
        toastForFieldIssue(firstInvalid, errorKeys[firstInvalid] ?? "required");
        return false;
      }

      if (method === "pickup_point") {
        const pickupKey = getPickupPointErrorKey(pickupPointId);
        validatePickupPoint(pickupPointId);
        if (pickupKey) {
          setShowValidationSummary(true);
          toastForFieldIssue("pickupPointId", pickupKey);
          return false;
        }
      }

      if (method === "courier") {
        const courierErrorKeys = getCourierFieldErrorKeys(courierForm);
        const mappedCourierErrors = mapCourierFieldErrors(
          courierErrorKeys,
          validationLabels,
        );
        setCourierFieldErrors(mappedCourierErrors);
        const firstCourierField = (
          [
            "courierDepartmentId",
            "courierProvinceSlug",
            "courierDni",
            "courierFullName",
            "courierAgencyAddress",
          ] as const
        ).find((field) => Boolean(courierErrorKeys[field]));
        if (firstCourierField) {
          setShowValidationSummary(true);
          scrollToCheckoutField(firstCourierField);
          toast.error(
            t("validation.invalidFieldToast", {
              field: courierFieldLabels[firstCourierField],
              section: t("validation.courierSection"),
            }),
          );
          return false;
        }
      }

      setShowValidationSummary(false);
      return true;
    },
    [
      courierFieldLabels,
      courierForm,
      pickupPointId,
      toastForFieldIssue,
      t,
      validationLabels,
      validatePickupPoint,
    ],
  );

  const validateField = useCallback(
    (
      field: CheckoutFormField,
      values: CheckoutFormValues,
      method: GuestCheckoutFulfillmentMethod,
    ) => {
      const errorKey = getCheckoutFieldErrorKey(values, field, method);
      const message = mapCheckoutFieldError(field, errorKey, validationLabels);

      setFieldErrors((current) => {
        const next = { ...current };
        if (message) next[field] = message;
        else delete next[field];
        return next;
      });

      if (Object.keys(getCheckoutFieldErrorKeys(values, method)).length === 0) {
        setShowValidationSummary(false);
      }
    },
    [validationLabels],
  );

  const zonesQuery = useQuery({
    queryKey: queryKeys.delivery.zones(),
    queryFn: async () => {
      const result = await listCheckoutDeliveryZonesAction();
      if (!result.ok) {
        logClientError("listCheckoutDeliveryZonesAction", result.error);
        throw new Error(result.error);
      }
      if (result.data.length === 0) {
        logClientError(
          "listCheckoutDeliveryZonesAction",
          "empty_zones_returned",
        );
      }
      return result.data;
    },
  });

  const pickupPointsQuery = useQuery({
    queryKey: queryKeys.checkout.pickupPoints(),
    queryFn: async () => {
      const result = await listCheckoutPickupPointsAction();
      if (!result.ok) {
        logClientError("listCheckoutPickupPointsAction", result.error);
        throw new Error(result.error);
      }
      return result.data;
    },
  });

  const pickupPoints = pickupPointsQuery.data ?? [];
  const showPickupPointOption = pickupPoints.length > 0;

  const courierDestinationsQuery = useQuery({
    queryKey: queryKeys.checkout.courierDestinations(),
    queryFn: async () => {
      const result = await listCheckoutCourierDestinationsAction();
      if (!result.ok) {
        logClientError("listCheckoutCourierDestinationsAction", result.error);
        throw new Error(result.error);
      }
      return result.data;
    },
  });

  const courierDepartments = courierDestinationsQuery.data ?? [];
  const showCourierOption = courierDepartments.length > 0;
  const showFulfillmentSelector = showPickupPointOption || showCourierOption;

  const feeQueryInput = useMemo(() => {
    if (fulfillmentMethod === "pickup_point") {
      return {
        method: "pickup_point" as const,
        pickupPointId: pickupPointId || undefined,
      };
    }
    if (fulfillmentMethod === "courier") {
      return {
        method: "courier" as const,
        departmentId: courierForm.courierDepartmentId || undefined,
        provinceSlug: courierForm.courierProvinceSlug || undefined,
      };
    }
    return {
      method: "delivery" as const,
      district: form.district,
      mapPin,
    };
  }, [
    courierForm.courierDepartmentId,
    courierForm.courierProvinceSlug,
    form.district,
    fulfillmentMethod,
    mapPin,
    pickupPointId,
  ]);

  const feeQuery = useQuery({
    ...freshQueryOptions,
    queryKey: queryKeys.checkout.fulfillmentFee(feeQueryInput),
    queryFn: async () => {
      const result = await resolveCheckoutDeliveryFeeAction(feeQueryInput);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled:
      fulfillmentMethod === "pickup_point"
        ? Boolean(pickupPointId)
        : fulfillmentMethod === "courier"
          ? Boolean(
              courierForm.courierDepartmentId &&
              courierForm.courierProvinceSlug,
            )
          : Boolean(form.district),
  });

  useEffect(() => {
    if (!isReady || orderPlacedRef.current || orderPlaced) return;
    if (lines.length === 0) {
      router.replace("/carrito");
    }
  }, [isReady, lines.length, orderPlaced, router]);

  useEffect(() => {
    if (!showPickupPointOption && fulfillmentMethod === "pickup_point") {
      setFulfillmentMethod("delivery");
    }
  }, [fulfillmentMethod, showPickupPointOption]);

  useEffect(() => {
    if (!showCourierOption && fulfillmentMethod === "courier") {
      setFulfillmentMethod("delivery");
    }
  }, [fulfillmentMethod, showCourierOption]);

  const shippingTotal = feeQuery.data?.fee ?? 0;
  const covered = feeQuery.data?.covered ?? false;
  const total = subtotal + shippingTotal - totals.discountTotal;
  const isDeliveryPending =
    (fulfillmentMethod === "delivery" && Boolean(form.district)) ||
    (fulfillmentMethod === "pickup_point" && Boolean(pickupPointId)) ||
    (fulfillmentMethod === "courier" &&
      Boolean(
        courierForm.courierDepartmentId && courierForm.courierProvinceSlug,
      ))
      ? feeQuery.isLoading || feeQuery.isFetching
      : false;

  if (!isReady) {
    return null;
  }

  if (orderPlaced) {
    return (
      <StorefrontLayout>
        <section className="container-max px-gutter py-section-lg">
          <p className="font-body text-body-lg text-on-surface-variant text-center">
            {t("redirecting")}
          </p>
        </section>
      </StorefrontLayout>
    );
  }

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    if (!validateForm(form, fulfillmentMethod)) return;

    if (lines.length === 0) {
      toast.error(t("emptyCart"));
      return;
    }

    if (isPricingPending) {
      toast.error(t("validation.pricingPendingToast"));
      return;
    }

    if (isPricingError) {
      toast.error(t("validation.pricingErrorToast"));
      return;
    }

    if (isDeliveryPending) {
      toast.error(t("validation.deliveryPendingToast"));
      return;
    }

    if (!covered) {
      toast.error(t("outOfCoverage"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const snapshotLines = toShoppingCartLines(lines);
    const validation = await validateGuestCheckoutCartAction({
      lines: snapshotLines,
    });

    if (!validation.ok) {
      setIsSubmitting(false);
      const redirectErrors = new Set([
        "PRODUCT_NOT_FOUND",
        "BUNDLE_NOT_FOUND",
        "PACK_NOT_FOUND",
        "INVALID_PURCHASE_QUANTITY",
        "INVALID_BUNDLE_CUSTOMIZATION",
        "DUPLICATE_PRODUCT_IN_BUNDLE",
      ]);
      if (redirectErrors.has(validation.error)) {
        writeCartSyncPayload({
          priceChanged: true,
          stockChanged: true,
          lines: snapshotLines,
          removedCount: 0,
          stock: { ok: false, shortages: [] },
        });
        router.replace("/carrito?sync=1");
        return;
      }
      setErrorMessage(t("errors.validation"));
      return;
    }

    if (!validation.data.ok) {
      setIsSubmitting(false);
      writeCartSyncPayload({
        priceChanged: validation.data.priceChanged,
        stockChanged: !validation.data.stockOk,
        lines: validation.data.lines,
        removedCount: 0,
        stock: validation.data.stock,
      });
      router.replace("/carrito?sync=1");
      return;
    }

    if (
      storeFeatures.strictStockValidationOnCheckout &&
      !validation.data.stockOk
    ) {
      setIsSubmitting(false);
      writeCartSyncPayload({
        priceChanged: validation.data.priceChanged,
        stockChanged: true,
        lines: validation.data.lines,
        removedCount: 0,
        stock: validation.data.stock,
      });
      router.replace("/carrito?sync=1");
      return;
    }

    const selectedPickupPoint = pickupPoints.find(
      (point) => point.id === pickupPointId,
    );
    const selectedCourierDepartment = courierDepartments.find(
      (department) => department.id === courierForm.courierDepartmentId,
    );
    const selectedCourierProvince = selectedCourierDepartment?.provinces.find(
      (province) => province.slug === courierForm.courierProvinceSlug,
    );

    const contact = {
      name: form.name.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    };
    const orderLines = cartLinesToOrderInput(lines);

    const result = await createGuestOrderAction(
      fulfillmentMethod === "pickup_point" && selectedPickupPoint
        ? {
            contact,
            fulfillment: {
              method: "pickup_point",
              pickupPoint: {
                id: selectedPickupPoint.id,
                name: selectedPickupPoint.name,
                lat: selectedPickupPoint.lat,
                lng: selectedPickupPoint.lng,
                fee: selectedPickupPoint.fee,
              },
              notes: null,
            },
            lines: orderLines,
            shippingTotal,
            discountTotal: 0,
          }
        : fulfillmentMethod === "courier" &&
            selectedCourierDepartment &&
            selectedCourierProvince
          ? {
              contact,
              fulfillment: {
                method: "courier",
                courier: {
                  destination: {
                    departmentId: selectedCourierDepartment.id,
                    departmentName: selectedCourierDepartment.name,
                    provinceSlug: selectedCourierProvince.slug,
                    provinceName: selectedCourierProvince.name,
                  },
                  recipient: {
                    dni: courierForm.courierDni.trim(),
                    fullName: courierForm.courierFullName.trim(),
                    agencyAddress: courierForm.courierAgencyAddress.trim(),
                  },
                },
                notes: null,
              },
              lines: orderLines,
              shippingTotal: 0,
              discountTotal: 0,
            }
          : {
              contact,
              fulfillment: {
                method: "delivery",
                deliveryAddress: {
                  recipientName:
                    `${form.name.trim()} ${form.lastName.trim()}`.trim(),
                  line1: form.line1.trim(),
                  district: form.district.trim(),
                  city: form.city.trim(),
                  province: form.province.trim(),
                  reference: form.reference.trim() || null,
                  phone: form.phone.trim(),
                },
                notes: null,
              },
              lines: orderLines,
              shippingTotal,
              discountTotal: 0,
              mapPin,
            },
    );

    setIsSubmitting(false);

    if (!result.ok) {
      if (
        result.error === "INSUFFICIENT_STOCK" ||
        result.error === "INVALID_PURCHASE_QUANTITY" ||
        result.error === "INVALID_BUNDLE_CUSTOMIZATION" ||
        result.error === "PRODUCT_NOT_FOUND" ||
        result.error === "BUNDLE_NOT_FOUND" ||
        result.error === "PACK_NOT_FOUND"
      ) {
        writeCartSyncPayload({
          priceChanged: result.error !== "INSUFFICIENT_STOCK",
          stockChanged: result.error === "INSUFFICIENT_STOCK",
          lines: validation.data.lines,
          removedCount: 0,
          stock: { ok: false, shortages: [] },
        });
        router.replace("/carrito?sync=1");
        return;
      }

      const messageMap: Record<GuestOrderErrorCode, string> = {
        OUT_OF_COVERAGE: t("errors.outOfCoverage"),
        INSUFFICIENT_STOCK: t("errors.insufficientStock"),
        INVALID_PURCHASE_QUANTITY: t("errors.invalidPurchaseQuantity"),
        INVALID_BUNDLE_CUSTOMIZATION: t("errors.invalidBundleCustomization"),
        VALIDATION: t("errors.validation"),
        PRODUCT_NOT_FOUND: t("errors.productNotFound"),
        BUNDLE_NOT_FOUND: t("errors.bundleNotFound"),
        PACK_NOT_FOUND: t("errors.packNotFound"),
        DUPLICATE_PRODUCT_IN_BUNDLE: t("errors.duplicateProductInBundle"),
        PICKUP_POINT_NOT_FOUND: t("errors.pickupPointNotFound"),
        PICKUP_POINT_INACTIVE: t("errors.pickupPointInactive"),
        PICKUP_POINT_REQUIRED: t("errors.pickupPointRequired"),
        SHIPPING_FEE_MISMATCH: t("errors.shippingFeeMismatch"),
        UNEXPECTED: t("errors.unexpected"),
      };
      const errorCode = result.error;
      setErrorMessage(messageMap[errorCode] ?? t("errors.unexpected"));
      return;
    }

    orderPlacedRef.current = true;
    setOrderPlaced(true);
    clear();
    router.replace(
      `/pedido/confirmacion?orderNumber=${encodeURIComponent(result.data.orderNumber)}&email=${encodeURIComponent(form.email.trim())}`,
    );
  };

  return (
    <CheckoutPage
      form={form}
      courierForm={courierForm}
      fieldErrors={fieldErrors}
      courierFieldErrors={courierFieldErrors}
      showValidationSummary={showValidationSummary}
      fulfillmentMethod={fulfillmentMethod}
      showFulfillmentSelector={showFulfillmentSelector}
      showPickupPointOption={showPickupPointOption}
      showCourierOption={showCourierOption}
      pickupPointId={pickupPointId}
      pickupPointError={pickupPointError}
      pickupPoints={pickupPoints}
      courierDepartments={courierDepartments}
      districts={zonesQuery.data ?? []}
      mapPin={mapPin}
      subtotal={subtotal}
      shippingTotal={shippingTotal}
      total={total}
      covered={covered}
      isDeliveryPending={isDeliveryPending}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      isStockPending={false}
      stockWarning={false}
      stockMessages={[]}
      labels={{
        title: t("title"),
        subtitle: t("subtitle"),
        backToCart: t("backToCart"),
        summaryTitle: t("summaryTitle"),
        secureNote: t("secureNote"),
        contactTitle: t("contactTitle"),
        fulfillmentTitle: t("fulfillmentTitle"),
        fulfillmentDelivery: t("fulfillmentDelivery"),
        fulfillmentPickupPoint: t("fulfillmentPickupPoint"),
        fulfillmentCourier: t("fulfillmentCourier"),
        courierTitle: t("courierTitle"),
        courierDepartment: t("courierDepartment"),
        courierDepartmentPlaceholder: t("courierDepartmentPlaceholder"),
        courierProvince: t("courierProvince"),
        courierProvincePlaceholder: t("courierProvincePlaceholder"),
        courierDni: t("courierDni"),
        courierFullName: t("courierFullName"),
        courierAgencyAddress: t("courierAgencyAddress"),
        courierFeeNote: t("courierFeeNote"),
        addressTitle: t("addressTitle"),
        pickupPointTitle: t("pickupPointTitle"),
        pickupPointPlaceholder: t("pickupPointPlaceholder"),
        mapSectionTitle: t("mapSectionTitle"),
        pickupMapHint: t("pickupMapHint"),
        name: t("name"),
        lastName: t("lastName"),
        phone: t("phone"),
        email: t("email"),
        line1: t("line1"),
        district: t("district"),
        districtPlaceholder: t("districtPlaceholder"),
        city: t("city"),
        province: t("province"),
        reference: t("reference"),
        referenceHint: t("referenceHint"),
        requiredHint: t("requiredHint"),
        mapTitle: t("mapTitle"),
        mapHint: t("mapHint"),
        mapSearchLabel: t("mapSearchLabel"),
        mapSearchPlaceholder: t("mapSearchPlaceholder"),
        mapSearchNoResults: t("mapSearchNoResults"),
        phoneHint: t("phoneHint"),
        subtotal: t("subtotal"),
        shipping: t("shipping"),
        shippingPending: t("shippingPending"),
        total: t("total"),
        submit: t("submit"),
        submitting: t("submitting"),
        outOfCoverage: t("outOfCoverage"),
        stockTitle: t("stockTitle"),
        stockChecking: t("stockChecking"),
        emptyCart: t("emptyCart"),
        validationSummary: t("validationSummary"),
        stepsLabel: t("steps.label"),
        stepCart: t("steps.cart"),
        stepCheckout: t("steps.checkout"),
        stepDone: t("steps.done"),
        validation: {
          required: t("validation.required"),
          invalidEmail: t("validation.invalidEmail"),
          invalidName: t("validation.invalidName"),
          invalidPhone: t("validation.invalidPhone"),
          invalidDni: t("validation.invalidDni"),
          tooShort: t("validation.tooShort"),
        },
      }}
      onChange={(field, value) => {
        const sanitized = sanitizeCheckoutField(field, value);
        setForm((current) => {
          const next = { ...current, [field]: sanitized };
          if (shouldValidateLive(field)) {
            validateField(field, next, fulfillmentMethod);
          }
          return next;
        });
        if (errorMessage) setErrorMessage(null);
      }}
      onCourierChange={(field, value) => {
        const sanitized = sanitizeCourierField(field, value);
        setCourierForm((current) => {
          const next =
            field === "courierDepartmentId"
              ? {
                  ...current,
                  courierDepartmentId: sanitized,
                  courierProvinceSlug: "",
                }
              : { ...current, [field]: sanitized };
          if (hasAttemptedSubmit) {
            const errorKeys = getCourierFieldErrorKeys(next);
            setCourierFieldErrors(
              mapCourierFieldErrors(errorKeys, validationLabels),
            );
          }
          return next;
        });
        if (errorMessage) setErrorMessage(null);
      }}
      onFieldBlur={(field, values) => {
        const trimmedValue =
          field === "email"
            ? values[field].trim().toLowerCase()
            : values[field].trim();
        const next = { ...values, [field]: trimmedValue };
        if (trimmedValue !== values[field]) {
          setForm(next);
        }
        setTouchedFields((current) => ({ ...current, [field]: true }));
        validateField(field, next, fulfillmentMethod);
      }}
      onCourierFieldBlur={(values) => {
        const errorKeys = getCourierFieldErrorKeys(values);
        setCourierFieldErrors(
          mapCourierFieldErrors(errorKeys, validationLabels),
        );
      }}
      onFulfillmentMethodChange={(method) => {
        setFulfillmentMethod(method);
        setFieldErrors({});
        setCourierFieldErrors({});
        setPickupPointError(null);
        setShowValidationSummary(false);
        if (errorMessage) setErrorMessage(null);
      }}
      onPickupPointChange={(value) => {
        setPickupPointId(value);
        if (hasAttemptedSubmit || pickupPointTouched || pickupPointError) {
          validatePickupPoint(value);
        }
        if (errorMessage) setErrorMessage(null);
      }}
      onPickupPointBlur={() => {
        setPickupPointTouched(true);
        validatePickupPoint(pickupPointId);
      }}
      onMapPinChange={setMapPin}
      onSubmit={() => {
        void handleSubmit();
      }}
    />
  );
}
