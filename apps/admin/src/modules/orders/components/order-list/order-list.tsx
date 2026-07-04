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
import { ORDER_STATUS_LABELS, type OrderListProps } from "./order-list.types";

export function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return <p className="text-sm text-zinc-500">No hay órdenes todavía.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nº orden</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Líneas</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.orderNumber}</TableCell>
            <TableCell>{order.customerName}</TableCell>
            <TableCell>
              <Badge variant="muted">
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </Badge>
            </TableCell>
            <TableCell>S/ {order.total.toFixed(2)}</TableCell>
            <TableCell>{order.lineCount}</TableCell>
            <TableCell>
              {new Date(order.createdAt).toLocaleString("es-PE")}
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/orders/${order.id}`}>
                <Button variant="secondary">Ver</Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
