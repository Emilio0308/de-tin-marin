"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { storeFeatures } from "@/config/store";
import { cartLinesToOrderInput } from "@/modules/cart/helpers/cart-to-order-input";
import { toShoppingCartLines } from "@/modules/cart/helpers/cart-lines";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { useCartPricingPreview } from "@/modules/cart/hooks/use-cart-pricing-preview";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { checkCartStockAction } from "@/modules/checkout/actions/check-cart-stock";
import { formatStockShortageMessages } from "@/shared/components/stock-banner/stock-banner";
import { createGuestOrderAction } from "@/modules/checkout/actions/create-guest-order";
import { listCheckoutDeliveryZonesAction } from "@/modules/checkout/actions/list-checkout-delivery-zones";
import { resolveCheckoutDeliveryFeeAction } from "@/modules/checkout/actions/resolve-checkout-delivery-fee";
import { queryKeys } from "@/shared/query/query-keys";
import { freshQueryOptions } from "@/shared/query/query-cache";
import type { MapPin } from "@de-tin-marin/validations/checkout";
import { defaultMapPin } from "../delivery-map/delivery-map.constants";
import {
  getCheckoutFieldErrorKey,
  getCheckoutFieldErrorKeys,
  hasCheckoutFieldError,
  mapCheckoutFieldError,
  mapCheckoutFieldErrors,
  type CheckoutFieldErrors,
  type CheckoutFormField,
  type CheckoutFormValues,
} from "./checkout-form.helpers";
import { CheckoutPage } from "./checkout-page";

type GuestOrderErrorCode =
  | "OUT_OF_COVERAGE"
  | "INSUFFICIENT_STOCK"
  | "INVALID_PURCHASE_QUANTITY"
  | "VALIDATION"
  | "PRODUCT_NOT_FOUND"
  | "BUNDLE_NOT_FOUND"
  | "DUPLICATE_PRODUCT_IN_BUNDLE"
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
  const [mapPin, setMapPin] = useState<MapPin>(defaultMapPin);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const orderPlacedRef = useRef(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const validationLabels = useMemo(
    () => ({
      required: t("validation.required"),
      invalidEmail: t("validation.invalidEmail"),
    }),
    [t],
  );

  const validateForm = useCallback(
    (values: CheckoutFormValues) => {
      const errorKeys = getCheckoutFieldErrorKeys(values);
      const mappedErrors = mapCheckoutFieldErrors(errorKeys, validationLabels);
      setFieldErrors(mappedErrors);
      const isValid = Object.keys(mappedErrors).length === 0;
      setShowValidationSummary(!isValid);
      return isValid;
    },
    [validationLabels],
  );

  const validateField = useCallback(
    (field: CheckoutFormField, values: CheckoutFormValues) => {
      const errorKey = getCheckoutFieldErrorKey(values, field);
      const message = mapCheckoutFieldError(field, errorKey, validationLabels);

      setFieldErrors((current) => {
        const next = { ...current };
        if (message) next[field] = message;
        else delete next[field];
        return next;
      });

      if (Object.keys(getCheckoutFieldErrorKeys(values)).length === 0) {
        setShowValidationSummary(false);
      }
    },
    [validationLabels],
  );

  const zonesQuery = useQuery({
    queryKey: queryKeys.delivery.zones(),
    queryFn: async () => {
      const result = await listCheckoutDeliveryZonesAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const deliveryQuery = useQuery({
    ...freshQueryOptions,
    queryKey: queryKeys.checkout.deliveryFee(form.district, mapPin),
    queryFn: async () => {
      const result = await resolveCheckoutDeliveryFeeAction({
        district: form.district,
        mapPin,
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(form.district),
  });

  const stockQuery = useQuery({
    ...freshQueryOptions,
    queryKey: queryKeys.checkout.stock(toShoppingCartLines(lines)),
    queryFn: async () => {
      const result = await checkCartStockAction({
        lines: toShoppingCartLines(lines),
      });
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: lines.length > 0,
  });

  useEffect(() => {
    if (!isReady || orderPlacedRef.current || orderPlaced) return;
    if (lines.length === 0) {
      router.replace("/carrito");
    }
  }, [isReady, lines.length, orderPlaced, router]);

  const shippingTotal = deliveryQuery.data?.fee ?? 0;
  const covered = deliveryQuery.data?.covered ?? false;
  const total = subtotal + shippingTotal - totals.discountTotal;
  const isDeliveryPending =
    Boolean(form.district) &&
    (deliveryQuery.isLoading || deliveryQuery.isFetching);

  const stockMessages = useMemo(
    () =>
      formatStockShortageMessages(stockQuery.data, {
        product: t("stockProduct"),
        container: t("stockContainer"),
      }),
    [stockQuery.data, t],
  );

  const stockBlocked =
    storeFeatures.strictStockValidationOnCheckout &&
    Boolean(stockQuery.data && !stockQuery.data.ok);
  const pricingBlocked = isPricingPending || isPricingError;
  const checkoutBlocked = stockBlocked || pricingBlocked;

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
    if (!validateForm(form)) return;

    if (
      !covered ||
      lines.length === 0 ||
      checkoutBlocked ||
      stockQuery.isLoading ||
      stockQuery.isFetching
    ) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await createGuestOrderAction({
      contact: {
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      },
      fulfillment: {
        method: "delivery",
        deliveryAddress: {
          recipientName: `${form.name.trim()} ${form.lastName.trim()}`.trim(),
          line1: form.line1.trim(),
          district: form.district.trim(),
          city: form.city.trim(),
          province: form.province.trim(),
          reference: form.reference.trim() || null,
          phone: form.phone.trim(),
        },
        notes: null,
      },
      lines: cartLinesToOrderInput(lines),
      shippingTotal,
      discountTotal: 0,
      mapPin,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      const messageMap: Record<GuestOrderErrorCode, string> = {
        OUT_OF_COVERAGE: t("errors.outOfCoverage"),
        INSUFFICIENT_STOCK: t("errors.insufficientStock"),
        INVALID_PURCHASE_QUANTITY: t("errors.invalidPurchaseQuantity"),
        VALIDATION: t("errors.validation"),
        PRODUCT_NOT_FOUND: t("errors.productNotFound"),
        BUNDLE_NOT_FOUND: t("errors.bundleNotFound"),
        DUPLICATE_PRODUCT_IN_BUNDLE: t("errors.duplicateProductInBundle"),
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
      fieldErrors={fieldErrors}
      showValidationSummary={showValidationSummary}
      districts={zonesQuery.data ?? []}
      mapPin={mapPin}
      subtotal={subtotal}
      shippingTotal={shippingTotal}
      total={total}
      covered={covered}
      isDeliveryPending={isDeliveryPending}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      stockBlocked={checkoutBlocked}
      isStockPending={stockQuery.isLoading || stockQuery.isFetching}
      stockWarning={Boolean(stockQuery.data && !stockQuery.data.ok)}
      stockMessages={stockMessages}
      labels={{
        title: t("title"),
        backToCart: t("backToCart"),
        contactTitle: t("contactTitle"),
        addressTitle: t("addressTitle"),
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
        validation: {
          required: t("validation.required"),
          invalidEmail: t("validation.invalidEmail"),
        },
      }}
      onChange={(field, value) => {
        setForm((current) => {
          const next = { ...current, [field]: value };
          if (hasAttemptedSubmit || hasCheckoutFieldError(fieldErrors, field)) {
            validateField(field, next);
          }
          return next;
        });
        if (errorMessage) setErrorMessage(null);
      }}
      onFieldBlur={(field, values) => {
        if (hasAttemptedSubmit || hasCheckoutFieldError(fieldErrors, field)) {
          validateField(field, values);
        }
      }}
      onMapPinChange={setMapPin}
      onSubmit={() => {
        void handleSubmit();
      }}
    />
  );
}
