"use client";

import Link from "next/link";
import { Badge } from "@de-tin-marin/ui/badge";
import { Button } from "@de-tin-marin/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@de-tin-marin/ui/table";
import type { CategoryListProps } from "./category-list.types";

export function CategoryList({
  categories,
  onDelete,
  deletingId,
}: CategoryListProps) {
  if (categories.length === 0) {
    return <p className="text-sm text-zinc-500">No hay categorías todavía.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Orden</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell>{category.slug}</TableCell>
            <TableCell>{category.sortOrder}</TableCell>
            <TableCell>
              <Badge variant={category.isActive ? "success" : "muted"}>
                {category.isActive ? "Activa" : "Inactiva"}
              </Badge>
            </TableCell>
            <TableCell className="space-x-2 text-right">
              <Link href={`/categories/${category.id}/edit`}>
                <Button variant="secondary">Editar</Button>
              </Link>
              <Button
                variant="secondary"
                disabled={deletingId === category.id}
                onClick={() => onDelete(category.id)}
              >
                {deletingId === category.id ? "Eliminando…" : "Eliminar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
