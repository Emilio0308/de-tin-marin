"use client";

import { Button } from "@de-tin-marin/ui/button";
import { Input } from "@de-tin-marin/ui/input";
import { Label } from "@de-tin-marin/ui/label";
import { Select } from "@de-tin-marin/ui/select";
import { Textarea } from "@de-tin-marin/ui/textarea";
import type { ProductFormProps } from "./product-form.types";
import { formField, formNumber } from "../form.helpers";

export function ProductForm({
  initial,
  categories,
  onSubmit,
  submitting,
  error,
}: ProductFormProps) {
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await onSubmit({
      sku: formField(formData, "sku"),
      name: formField(formData, "name"),
      description: formField(formData, "description"),
      slug: formField(formData, "slug"),
      brand: formField(formData, "brand"),
      netPrice: formNumber(formData, "netPrice"),
      stockQuantity: formNumber(formData, "stockQuantity"),
      categoryId: formField(formData, "categoryId"),
      imageUrl: formField(formData, "imageUrl"),
      isActive: formData.get("isActive") === "on",
    });
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mx-auto flex max-w-2xl flex-col gap-4"
    >
      <div className="space-y-2">
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" name="sku" defaultValue={initial?.sku ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initial?.name ?? ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initial?.description ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={initial?.slug ?? ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="brand">Marca</Label>
        <Input id="brand" name="brand" defaultValue={initial?.brand ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoría</Label>
        <Select
          id="categoryId"
          name="categoryId"
          defaultValue={initial?.categoryId ?? ""}
          required
        >
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="netPrice">Precio final (IGV incl.)</Label>
          <Input
            id="netPrice"
            name="netPrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={initial?.netPrice ?? 0}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stockQuantity">Stock</Label>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min={0}
            defaultValue={initial?.stockQuantity ?? 0}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL de imagen</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          defaultValue={initial?.imageUrl ?? ""}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial?.isActive ?? true}
        />
        Activo
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
