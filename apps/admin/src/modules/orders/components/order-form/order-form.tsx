"use client";

import { useState } from "react";
import { Button } from "@de-tin-marin/ui/button";
import { Input } from "@de-tin-marin/ui/input";
import { Label } from "@de-tin-marin/ui/label";
import type {
  BundleOption,
  OrderFormValues,
  ProductOption,
} from "./order-form.types";

type OrderFormProps = {
  values: OrderFormValues;
  products: ProductOption[];
  bundles: BundleOption[];
  deliveryDistricts: string[];
  totals: {
    subtotal: number;
    discountTotal: number;
    shippingTotal: number;
    total: number;
  } | null;
  submitting: boolean;
  error: string | null;
  onChange: (values: OrderFormValues) => void;
  onAddProductLine: (productId: string, quantity: number) => void;
  onAddBundleLine: (bundleId: string, quantity: number) => void;
  onRemoveLine: (index: number) => void;
  onSubmit: () => void;
};

export function OrderForm({
  values,
  products,
  bundles,
  deliveryDistricts,
  totals,
  submitting,
  error,
  onChange,
  onAddProductLine,
  onAddBundleLine,
  onRemoveLine,
  onSubmit,
}: OrderFormProps) {
  const [draftProductId, setDraftProductId] = useState("");
  const [draftProductQty, setDraftProductQty] = useState(1);
  const [draftBundleId, setDraftBundleId] = useState("");
  const [draftBundleQty, setDraftBundleQty] = useState(1);

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">Nombre</Label>
          <Input
            id="contact-name"
            value={values.contact.name}
            onChange={(event) =>
              onChange({
                ...values,
                contact: { ...values.contact, name: event.target.value },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="contact-last-name">Apellido</Label>
          <Input
            id="contact-last-name"
            value={values.contact.lastName}
            onChange={(event) =>
              onChange({
                ...values,
                contact: { ...values.contact, lastName: event.target.value },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="contact-phone">Teléfono</Label>
          <Input
            id="contact-phone"
            value={values.contact.phone}
            onChange={(event) =>
              onChange({
                ...values,
                contact: { ...values.contact, phone: event.target.value },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={values.contact.email}
            onChange={(event) =>
              onChange({
                ...values,
                contact: { ...values.contact, email: event.target.value },
              })
            }
          />
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Entrega</h2>
        <div className="flex gap-4">
          {(["delivery", "pickup"] as const).map((method) => (
            <label key={method} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={values.fulfillment.method === method}
                onChange={() =>
                  onChange({
                    ...values,
                    fulfillment: { ...values.fulfillment, method },
                  })
                }
              />
              {method === "delivery" ? "Delivery" : "Recojo"}
            </label>
          ))}
        </div>
        {values.fulfillment.method === "delivery" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ["recipientName", "Destinatario", "text"],
                ["line1", "Dirección", "text"],
                ["district", "Distrito", "district"],
                ["city", "Ciudad", "text"],
                ["province", "Provincia", "text"],
                ["phone", "Teléfono entrega", "text"],
                ["reference", "Referencia", "text"],
              ] as const
            ).map(([field, label, fieldType]) => (
              <div key={field}>
                <Label>{label}</Label>
                {fieldType === "district" ? (
                  <select
                    className="block w-full rounded border px-3 py-2 text-sm"
                    value={values.fulfillment.deliveryAddress.district}
                    onChange={(event) =>
                      onChange({
                        ...values,
                        fulfillment: {
                          ...values.fulfillment,
                          deliveryAddress: {
                            ...values.fulfillment.deliveryAddress,
                            district: event.target.value,
                          },
                        },
                      })
                    }
                  >
                    <option value="">Seleccionar distrito…</option>
                    {deliveryDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={values.fulfillment.deliveryAddress[field]}
                    onChange={(event) =>
                      onChange({
                        ...values,
                        fulfillment: {
                          ...values.fulfillment,
                          deliveryAddress: {
                            ...values.fulfillment.deliveryAddress,
                            [field]: event.target.value,
                          },
                        },
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Order shopping cart</h2>

        <div className="flex flex-wrap items-end gap-2 rounded border p-4">
          <div>
            <Label>Producto</Label>
            <select
              className="block min-w-48 rounded border px-3 py-2 text-sm"
              value={draftProductId}
              onChange={(event) => setDraftProductId(event.target.value)}
            >
              <option value="">Seleccionar…</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (S/ {product.finalPrice.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              min={1}
              className="w-24"
              value={draftProductQty}
              onChange={(event) =>
                setDraftProductQty(Number(event.target.value) || 1)
              }
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!draftProductId) return;
              onAddProductLine(draftProductId, draftProductQty);
            }}
          >
            Agregar producto
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded border p-4">
          <div>
            <Label>Sorpresa (plantilla)</Label>
            <select
              className="block min-w-48 rounded border px-3 py-2 text-sm"
              value={draftBundleId}
              onChange={(event) => setDraftBundleId(event.target.value)}
            >
              <option value="">Seleccionar…</option>
              {bundles.map((bundle) => (
                <option key={bundle.id} value={bundle.id}>
                  {bundle.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Cant. sorpresas</Label>
            <Input
              type="number"
              min={1}
              className="w-24"
              value={draftBundleQty}
              onChange={(event) =>
                setDraftBundleQty(Number(event.target.value) || 1)
              }
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!draftBundleId) return;
              onAddBundleLine(draftBundleId, draftBundleQty);
            }}
          >
            Agregar sorpresa
          </Button>
        </div>

        {values.lines.length === 0 ? (
          <p className="text-sm text-zinc-500">Agrega al menos una línea.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {values.lines.map((line, index) => {
              const label =
                line.type === "product"
                  ? products.find((product) => product.id === line.productId)
                      ?.name
                  : bundles.find((bundle) => bundle.id === line.bundleId)?.name;
              return (
                <li
                  key={`${line.type}-${index}`}
                  className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                >
                  <span>
                    {line.type === "product" ? "Producto" : "Sorpresa"}: {label}{" "}
                    × {line.quantity}
                    {line.type === "bundle"
                      ? ` (${line.components.length} componentes)`
                      : ""}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onRemoveLine(index)}
                  >
                    Quitar
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid max-w-md gap-4">
        <div>
          <Label>Envío (S/)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            readOnly
            value={values.shippingTotal}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Calculado según distrito (Piura) o recojo en tienda.
          </p>
        </div>
        <div>
          <Label>Descuento (S/)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={values.discountTotal}
            onChange={(event) =>
              onChange({
                ...values,
                discountTotal: Number(event.target.value) || 0,
              })
            }
          />
        </div>
        {totals ? (
          <div className="rounded border p-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>S/ {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>S/ {totals.total.toFixed(2)}</span>
            </div>
          </div>
        ) : null}
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={submitting || values.lines.length === 0}>
        {submitting ? "Creando…" : "Crear orden"}
      </Button>
    </form>
  );
}
