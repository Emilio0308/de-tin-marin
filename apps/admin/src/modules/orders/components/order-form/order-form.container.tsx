"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { getBundleAction } from "@/modules/catalog/actions/get-bundle";
import { listBundlesAction } from "@/modules/catalog/actions/list-bundles";
import { listProductsAction } from "@/modules/catalog/actions/list-products";
import {
  listDeliveryZonesAction,
  resolveDeliveryFeeAction,
} from "@/modules/delivery/actions/delivery.actions";
import { createOrderAction } from "@/modules/orders/actions/create-order";
import { OrderForm } from "./order-form";
import {
  createBundleLineFromTemplate,
  previewOrderTotals,
  toCreateOrderPayload,
} from "./order-form.helpers";
import { emptyOrderFormValues, type OrderFormValues } from "./order-form.types";

function orderErrorMessage(result: {
  error: string;
  message?: string;
}): string {
  switch (result.error) {
    case "VALIDATION":
      return "Revisa los campos del formulario";
    case "PRODUCT_NOT_FOUND":
      return "Uno o más productos no existen o están inactivos";
    case "BUNDLE_NOT_FOUND":
      return "La plantilla de sorpresa no existe o está inactiva";
    case "DUPLICATE_PRODUCT_IN_BUNDLE":
      return "No puedes repetir el mismo producto en una sorpresa";
    case "UNAUTHORIZED":
      return "Tu sesión expiró. Inicia sesión de nuevo.";
    case "FORBIDDEN":
      return "No tienes permisos de administrador.";
    default:
      return result.message
        ? `No se pudo crear la orden: ${result.message}`
        : "No se pudo crear la orden";
  }
}

export function OrderFormContainer() {
  const router = useRouter();
  const [values, setValues] = useState<OrderFormValues>(emptyOrderFormValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const result = await listProductsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const bundlesQuery = useQuery({
    queryKey: ["bundles"],
    queryFn: async () => {
      const result = await listBundlesAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const deliveryZonesQuery = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const result = await listDeliveryZonesAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const productOptions = useMemo(
    () =>
      (productsQuery.data ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        finalPrice: product.finalPrice,
      })),
    [productsQuery.data],
  );

  const bundleOptions = useMemo(
    () =>
      (bundlesQuery.data ?? []).map((bundle) => ({
        id: bundle.id,
        name: bundle.name,
        containerId: bundle.containerId,
        containerName: bundle.containerName,
        containerNetPrice: bundle.containerNetPrice,
      })),
    [bundlesQuery.data],
  );

  const bundlesById = useMemo(
    () =>
      new Map(
        bundleOptions.map((bundle) => [
          bundle.id,
          {
            name: bundle.name,
            container: {
              containerId: bundle.containerId,
              sku: "",
              name: bundle.containerName,
              unitPrice: bundle.containerNetPrice,
            },
          },
        ]),
      ),
    [bundleOptions],
  );

  useEffect(() => {
    void (async () => {
      const result = await resolveDeliveryFeeAction({
        method: values.fulfillment.method,
        district: values.fulfillment.deliveryAddress.district,
      });
      if (!result.ok) return;
      setValues((current) =>
        current.shippingTotal === result.fee
          ? current
          : { ...current, shippingTotal: result.fee },
      );
    })();
  }, [values.fulfillment.method, values.fulfillment.deliveryAddress.district]);

  const totals = previewOrderTotals(values, productOptions, bundlesById);

  function handleAddProductLine(productId: string, quantity: number) {
    setValues((current) => ({
      ...current,
      lines: [...current.lines, { type: "product", productId, quantity }],
    }));
  }

  function handleAddBundleLine(bundleId: string, quantity: number) {
    void (async () => {
      const result = await getBundleAction(bundleId);
      if (!result.ok) {
        setError("No se pudo cargar la plantilla de sorpresa");
        return;
      }

      setValues((current) => ({
        ...current,
        lines: [
          ...current.lines,
          createBundleLineFromTemplate(bundleId, quantity, result.data.items),
        ],
      }));
    })();
  }

  function handleRemoveLine(index: number) {
    setValues((current) => ({
      ...current,
      lines: current.lines.filter((_, lineIndex) => lineIndex !== index),
    }));
  }

  function handleSubmit() {
    void (async () => {
      setSubmitting(true);
      setError(null);

      try {
        const result = await createOrderAction(toCreateOrderPayload(values));
        if (!result.ok) {
          setError(orderErrorMessage(result));
          return;
        }

        startTransition(() => {
          router.push(`/orders/${result.data.id}`);
        });
      } catch {
        setError("No se pudo crear la orden");
      } finally {
        setSubmitting(false);
      }
    })();
  }

  if (
    productsQuery.isLoading ||
    bundlesQuery.isLoading ||
    deliveryZonesQuery.isLoading
  ) {
    return <p className="p-8 text-sm text-zinc-500">Cargando catálogo…</p>;
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Nueva orden</h1>
        <p className="text-zinc-600">
          Crear pedido manual con carrito congelado
        </p>
      </div>
      <OrderForm
        values={values}
        products={productOptions}
        bundles={bundleOptions}
        deliveryDistricts={(deliveryZonesQuery.data ?? [])
          .filter((zone) => zone.isActive)
          .map((zone) => zone.district)}
        totals={totals}
        submitting={submitting}
        error={error}
        onChange={setValues}
        onAddProductLine={handleAddProductLine}
        onAddBundleLine={handleAddBundleLine}
        onRemoveLine={handleRemoveLine}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
