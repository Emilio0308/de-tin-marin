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
import type { ProductListProps } from "./product-list.types";

export function ProductList({
  products,
  onDelete,
  deletingId,
}: ProductListProps) {
  if (products.length === 0) {
    return <p className="text-sm text-zinc-500">No hay productos todavía.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>{product.sku}</TableCell>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>{product.categoryName}</TableCell>
            <TableCell>S/ {product.netPrice.toFixed(2)}</TableCell>
            <TableCell>{product.stockQuantity}</TableCell>
            <TableCell>
              <Badge variant={product.isActive ? "success" : "muted"}>
                {product.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            <TableCell className="space-x-2 text-right">
              <Link href={`/products/${product.id}/edit`}>
                <Button variant="secondary">Editar</Button>
              </Link>
              <Button
                variant="secondary"
                disabled={deletingId === product.id}
                onClick={() => onDelete(product.id)}
              >
                {deletingId === product.id ? "Eliminando…" : "Eliminar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
