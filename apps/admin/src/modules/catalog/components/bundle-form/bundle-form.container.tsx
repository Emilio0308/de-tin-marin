"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { createBundleAction } from "@/modules/catalog/actions/create-bundle";
import { listProductsAction } from "@/modules/catalog/actions/list-products";
import { updateBundleAction } from "@/modules/catalog/actions/update-bundle";
import { BundleForm } from "./bundle-form";
import type {
  BundleFormContainerProps,
  BundleFormValues,
  ProductOption,
} from "./bundle-form.types";

function bundleErrorMessage(result: {
  error: string;
  message?: string;
}): string {
  switch (result.error) {
    case "VALIDATION":
      return "Revisa los campos del formulario";
    case "PRODUCT_NOT_FOUND":
      return "Uno o más productos no existen o están inactivos";
    case "DUPLICATE_PRODUCT":
      return "No puedes agregar el mismo producto dos veces";
    case "NOT_FOUND":
      return "El paquete no existe";
    case "UNAUTHORIZED":
      return "Tu sesión expiró. Inicia sesión de nuevo.";
    case "FORBIDDEN":
      return "No tienes permisos de administrador.";
    default:
      return result.message
        ? `No se pudo guardar el paquete: ${result.message}`
        : "No se pudo guardar el paquete";
  }
}

export function BundleFormContainer({
  mode,
  initial,
}: BundleFormContainerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const result = await listProductsAction();
      if (!result.ok) {
        throw new Error("message" in result ? result.message : result.error);
      }
      return result.data;
    },
  });

  async function handleSubmit(values: BundleFormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const payload =
        mode === "create"
          ? values
          : {
              id: initial?.id,
              ...values,
            };

      const result =
        mode === "create"
          ? await createBundleAction(payload)
          : await updateBundleAction(payload);

      if (!result.ok) {
        setError(bundleErrorMessage(result));
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["bundles"] });

      startTransition(() => {
        router.push("/bundles");
      });
    } catch {
      setError("No se pudo guardar el paquete. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (productsQuery.isLoading) {
    return <p className="p-8 text-sm text-zinc-500">Cargando productos…</p>;
  }

  if (productsQuery.isError || !productsQuery.data?.length) {
    return (
      <p className="p-8 text-sm text-red-600">
        Crea al menos un producto antes de agregar paquetes.
      </p>
    );
  }

  const products: ProductOption[] = productsQuery.data.map((product) => ({
    id: product.id,
    name: product.name,
    netPrice: product.netPrice,
  }));

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">
        {mode === "create" ? "Nuevo paquete" : "Editar paquete"}
      </h1>
      <BundleForm
        initial={initial}
        products={products}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}
