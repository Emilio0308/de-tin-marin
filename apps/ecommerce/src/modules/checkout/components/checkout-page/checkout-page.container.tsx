"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { storeFeatures } from "@/config/store";
import { cartLinesToOrderInput } from "@/modules/cart/helpers/cart-to-order-input";
import { toShoppingCartLines } from "@/modules/cart/helpers/cart-lines";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { StorefrontLayout } from "@/modules/home/components/storefront-layout/storefront-layout";
import { checkCartStockAction } from "@/modules/checkout/actions/check-cart-stock";
import { createGuestOrderAction } from "@/modules/checkout/actions/create-guest-order";
import { listCheckoutDeliveryZonesAction } from "@/modules/checkout/actions/list-checkout-delivery-zones";
import { resolveCheckoutDeliveryFeeAction } from "@/modules/checkout/actions/resolve-checkout-delivery-fee";
import { queryKeys } from "@/shared/query/query-keys";
import type { MapPin } from "@de-tin-marin/validations/checkout";
import { defaultMapPin } from "../delivery-map/delivery-map.constants";
import { CheckoutPage } from "./checkout-page";

const initialForm = {
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
  const [form, setForm] = useState(initialForm);
  const [mapPin, setMapPin] = useState<MapPin>(defaultMapPin);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const orderPlacedRef = useRef(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const zonesQuery = useQuery({
    queryKey: queryKeys.delivery.zones(),
    queryFn: async () => {
      const result = await listCheckoutDeliveryZonesAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const deliveryQuery = useQuery({
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
  const total = totals.subtotal + shippingTotal - totals.discountTotal;

  const stockMessages = useMemo(() => {
    if (!stockQuery.data || stockQuery.data.ok) return [];
    return stockQuery.data.shortages.map(
      (shortage) =>
        `${shortage.kind === "product" ? t("stockProduct") : t("stockContainer")} ${shortage.name ?? shortage.sku}: ${shortage.available}/${shortage.required}`,
    );
  }, [stockQuery.data, t]);

  const stockBlocked =
    storeFeatures.strictStockValidationOnCheckout &&
    Boolean(stockQuery.data && !stockQuery.data.ok);

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
    if (!covered || lines.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await createGuestOrderAction({
      contact: {
        name: form.name,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
      },
      fulfillment: {
        method: "delivery",
        deliveryAddress: {
          recipientName: `${form.name} ${form.lastName}`.trim(),
          line1: form.line1,
          district: form.district,
          city: form.city,
          province: form.province,
          reference: form.reference || null,
          phone: form.phone,
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
      const messageMap: Record<string, string> = {
        OUT_OF_COVERAGE: t("errors.outOfCoverage"),
        INSUFFICIENT_STOCK: t("errors.insufficientStock"),
        VALIDATION: t("errors.validation"),
        PRODUCT_NOT_FOUND: t("errors.validation"),
        BUNDLE_NOT_FOUND: t("errors.validation"),
        DUPLICATE_PRODUCT_IN_BUNDLE: t("errors.validation"),
      };
      setErrorMessage(messageMap[result.error] ?? t("errors.validation"));
      return;
    }

    orderPlacedRef.current = true;
    setOrderPlaced(true);
    clear();
    router.replace(
      `/pedido/confirmacion?orderNumber=${encodeURIComponent(result.data.orderNumber)}&email=${encodeURIComponent(form.email)}`,
    );
  };

  return (
    <CheckoutPage
      form={form}
      districts={zonesQuery.data ?? []}
      mapPin={mapPin}
      subtotal={totals.subtotal}
      shippingTotal={shippingTotal}
      total={total}
      covered={covered}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      stockBlocked={stockBlocked}
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
        city: t("city"),
        province: t("province"),
        reference: t("reference"),
        mapTitle: t("mapTitle"),
        mapHint: t("mapHint"),
        subtotal: t("subtotal"),
        shipping: t("shipping"),
        total: t("total"),
        submit: t("submit"),
        submitting: t("submitting"),
        outOfCoverage: t("outOfCoverage"),
        stockTitle: t("stockTitle"),
        emptyCart: t("emptyCart"),
      }}
      onChange={(field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
      }}
      onMapPinChange={setMapPin}
      onSubmit={() => {
        void handleSubmit();
      }}
    />
  );
}
