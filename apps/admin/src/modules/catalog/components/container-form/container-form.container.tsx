"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@de-tin-marin/ui/button";
import { Input } from "@de-tin-marin/ui/input";
import { Label } from "@de-tin-marin/ui/label";
import { createSurpriseContainerAction } from "@/modules/catalog/actions/create-surprise-container";
import { getSurpriseContainerAction } from "@/modules/catalog/actions/get-surprise-container";
import { updateSurpriseContainerAction } from "@/modules/catalog/actions/update-surprise-container";
import type { SurpriseContainerFormDTO } from "@/modules/catalog/types/surprise-container.dto";

type ContainerFormContainerProps = {
  mode: "create" | "edit";
  containerId?: string;
};

const emptyValues = {
  sku: "",
  name: "",
  description: "",
  netPrice: 0,
  stockQuantity: 0,
  isActive: true,
};

export function ContainerFormContainer({
  mode,
  containerId,
}: ContainerFormContainerProps) {
  const router = useRouter();
  const [values, setValues] = useState(emptyValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerQuery = useQuery({
    queryKey: ["surprise-container", containerId],
    enabled: mode === "edit" && Boolean(containerId),
    queryFn: async () => {
      const result = await getSurpriseContainerAction(containerId!);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  useEffect(() => {
    if (!containerQuery.data) return;
    const data: SurpriseContainerFormDTO = containerQuery.data;
    setValues({
      sku: data.sku,
      name: data.name,
      description: data.description ?? "",
      netPrice: data.netPrice,
      stockQuantity: data.stockQuantity,
      isActive: data.isActive,
    });
  }, [containerQuery.data]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      ...values,
      description: values.description || null,
    };

    const result =
      mode === "create"
        ? await createSurpriseContainerAction(payload)
        : await updateSurpriseContainerAction({ id: containerId, ...payload });

    setSubmitting(false);

    if (!result.ok) {
      setError(
        result.error === "DUPLICATE_SKU"
          ? "El SKU ya existe"
          : "No se pudo guardar el envase",
      );
      return;
    }

    router.push("/containers");
  }

  if (mode === "edit" && containerQuery.isLoading) {
    return <p className="p-8 text-sm text-zinc-500">Cargando envase…</p>;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">
          {mode === "create" ? "Nuevo envase" : "Editar envase"}
        </h1>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="grid gap-4"
      >
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            required
            value={values.sku}
            onChange={(event) =>
              setValues((current) => ({ ...current, sku: event.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            required
            value={values.name}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="netPrice">Precio (S/)</Label>
          <Input
            id="netPrice"
            type="number"
            min={0}
            step="0.01"
            required
            value={values.netPrice}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                netPrice: Number(event.target.value) || 0,
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="stockQuantity">Stock</Label>
          <Input
            id="stockQuantity"
            type="number"
            min={0}
            step={1}
            required
            value={values.stockQuantity}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                stockQuantity: Number(event.target.value) || 0,
              }))
            }
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                isActive: event.target.checked,
              }))
            }
          />
          Activo
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/containers")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
