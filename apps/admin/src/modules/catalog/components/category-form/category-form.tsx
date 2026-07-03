"use client";

import { Button } from "@de-tin-marin/ui/button";
import { Input } from "@de-tin-marin/ui/input";
import { Label } from "@de-tin-marin/ui/label";
import { Textarea } from "@de-tin-marin/ui/textarea";
import type { CategoryFormProps } from "./category-form.types";
import { formField, formNumber } from "../form.helpers";

export function CategoryForm({
  initial,
  onSubmit,
  submitting,
  error,
}: CategoryFormProps) {
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await onSubmit({
      name: formField(formData, "name"),
      description: formField(formData, "description"),
      slug: formField(formData, "slug"),
      sortOrder: formNumber(formData, "sortOrder"),
      isActive: formData.get("isActive") === "on",
    });
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mx-auto flex max-w-2xl flex-col gap-4"
    >
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
        <Label htmlFor="sortOrder">Orden</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={initial?.sortOrder ?? 0}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial?.isActive ?? true}
        />
        Activa
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
