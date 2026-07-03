"use client";

import { useMemo, useState } from "react";
import { Button } from "@de-tin-marin/ui/button";
import { Input } from "@de-tin-marin/ui/input";
import { Label } from "@de-tin-marin/ui/label";
import { Select } from "@de-tin-marin/ui/select";
import { Textarea } from "@de-tin-marin/ui/textarea";
import {
  addBundleItem,
  buildDefaultBundleValues,
  computeLiveTotal,
  removeBundleItem,
} from "./bundle-form.helpers";
import type { BundleFormProps } from "./bundle-form.types";

export function BundleForm({
  initial,
  products,
  onSubmit,
  submitting,
  error,
}: BundleFormProps) {
  const [values, setValues] = useState(() => buildDefaultBundleValues(initial));
  const [selectedProductId, setSelectedProductId] = useState("");

  const availableProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          !values.items.some((item) => item.productId === product.id),
      ),
    [products, values.items],
  );

  const priceSummary = useMemo(
    () => computeLiveTotal(values, products),
    [values, products],
  );

  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await onSubmit(values);
    } catch {
      // El container maneja errores; evitar unhandled rejection [object Event].
    }
  }

  function handleAddProduct() {
    if (!selectedProductId) return;
    setValues((current) => ({
      ...current,
      items: addBundleItem(current.items, selectedProductId),
    }));
    setSelectedProductId("");
  }

  function handleRemoveProduct(productId: string) {
    setValues((current) => ({
      ...current,
      items: removeBundleItem(current.items, productId),
    }));
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="mx-auto flex max-w-2xl flex-col gap-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          value={values.name}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="serviceFee">Fee de servicio (S/)</Label>
          <Input
            id="serviceFee"
            name="serviceFee"
            type="number"
            min={0}
            step="0.01"
            value={values.serviceFee}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                serviceFee: Number(event.target.value),
              }))
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad de personas</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            step={1}
            value={values.quantity}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                quantity: Number(event.target.value),
              }))
            }
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL de imagen</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          value={values.imageUrl}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              imageUrl: event.target.value,
            }))
          }
        />
      </div>

      <div className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <Label>Productos del paquete</Label>
        <div className="flex gap-2">
          <Select
            value={selectedProductId}
            onChange={(event) => setSelectedProductId(event.target.value)}
          >
            <option value="">Selecciona un producto</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} (S/ {product.netPrice.toFixed(2)})
              </option>
            ))}
          </Select>
          <Button type="button" variant="secondary" onClick={handleAddProduct}>
            Agregar
          </Button>
        </div>

        {values.items.length === 0 ? (
          <p className="text-sm text-zinc-500">Agrega al menos un producto.</p>
        ) : (
          <ul className="space-y-2">
            {values.items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-sm"
              >
                <span>
                  {productNameById.get(item.productId) ?? "Producto"} ×{" "}
                  {item.unitsPerPerson} por persona
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleRemoveProduct(item.productId)}
                >
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg bg-zinc-50 p-4 text-sm">
        <p>
          Subtotal productos (por persona): S/{" "}
          {priceSummary.itemsSubtotal.toFixed(2)}
        </p>
        <p>Fee de servicio: S/ {values.serviceFee.toFixed(2)}</p>
        <p className="font-semibold">
          Total del paquete: S/ {priceSummary.total.toFixed(2)}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
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
      <Button type="submit" disabled={submitting || values.items.length === 0}>
        {submitting ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
