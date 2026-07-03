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
import type { BundleListProps } from "./bundle-list.types";

export function BundleList({ bundles, onDelete, deletingId }: BundleListProps) {
  if (bundles.length === 0) {
    return <p className="text-sm text-zinc-500">No hay paquetes todavía.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Personas</TableHead>
          <TableHead>Fee servicio</TableHead>
          <TableHead>Productos</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bundles.map((bundle) => (
          <TableRow key={bundle.id}>
            <TableCell className="font-medium">{bundle.name}</TableCell>
            <TableCell>{bundle.quantity}</TableCell>
            <TableCell>S/ {bundle.serviceFee.toFixed(2)}</TableCell>
            <TableCell>{bundle.itemCount}</TableCell>
            <TableCell>S/ {bundle.total.toFixed(2)}</TableCell>
            <TableCell>
              <Badge variant={bundle.isActive ? "success" : "muted"}>
                {bundle.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            <TableCell className="space-x-2 text-right">
              <Link href={`/bundles/${bundle.id}/edit`}>
                <Button variant="secondary">Editar</Button>
              </Link>
              <Button
                variant="secondary"
                disabled={deletingId === bundle.id}
                onClick={() => onDelete(bundle.id)}
              >
                {deletingId === bundle.id ? "Eliminando…" : "Eliminar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
