import type { OrderShoppingCartLine } from "@de-tin-marin/shared/order-cart";
import type { Json } from "@de-tin-marin/types/database";
import {
  orderShoppingCartBundleLineSchema,
  orderShoppingCartPackLineSchema,
  orderShoppingCartProductLineSchema,
} from "@de-tin-marin/validations/order";
import type { CatalogStatusOrderCartLineRow } from "../types/catalog-status-report.dto";

function parseCartLine(raw: unknown): OrderShoppingCartLine | null {
  const product = orderShoppingCartProductLineSchema.safeParse(raw);
  if (product.success) return product.data;

  const pack = orderShoppingCartPackLineSchema.safeParse(raw);
  if (pack.success) return pack.data;

  const bundle = orderShoppingCartBundleLineSchema.safeParse(raw);
  if (bundle.success) return bundle.data;

  return null;
}

export function flattenOrderCartLines(
  shoppingCart: Json | null | undefined,
): CatalogStatusOrderCartLineRow[] {
  if (!shoppingCart || typeof shoppingCart !== "object") return [];
  const linesRaw = (shoppingCart as { lines?: unknown }).lines;
  if (!Array.isArray(linesRaw)) return [];

  const rows: CatalogStatusOrderCartLineRow[] = [];

  for (const raw of linesRaw) {
    const line = parseCartLine(raw);
    if (!line) continue;

    if (line.type === "product") {
      rows.push({
        level: "line",
        lineType: "product",
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        detail: null,
      });
      continue;
    }

    if (line.type === "pack") {
      rows.push({
        level: "line",
        lineType: "pack",
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        detail: `${line.components.length} componentes`,
      });
      for (const component of line.components) {
        rows.push({
          level: "component",
          lineType: "",
          sku: component.sku,
          name: component.productName,
          quantity: component.totalPackages,
          unitPrice: null,
          lineTotal: null,
          detail: `${component.packageQuantity} presentaciones × ${line.quantity} = ${component.totalPackages}`,
        });
      }
      continue;
    }

    rows.push({
      level: "line",
      lineType: "bundle",
      sku: line.bundleId,
      name: line.name,
      quantity: line.quantity,
      unitPrice: null,
      lineTotal: line.lineTotal,
      detail: `${line.components.length} componentes`,
    });

    if (line.container) {
      rows.push({
        level: "container",
        lineType: "",
        sku: line.container.sku,
        name: line.container.name,
        quantity: line.quantity,
        unitPrice: line.container.unitPrice,
        lineTotal: null,
        detail: "Envase",
      });
    } else if (line.serviceFee !== undefined) {
      rows.push({
        level: "container",
        lineType: "",
        sku: "—",
        name: "Service fee (legacy)",
        quantity: line.quantity,
        unitPrice: line.serviceFee,
        lineTotal: null,
        detail: "Legacy",
      });
    }

    for (const component of line.components) {
      rows.push({
        level: "component",
        lineType: "",
        sku: component.sku,
        name: component.productName,
        quantity: component.totalQuantity,
        unitPrice: component.unitPrice,
        lineTotal: null,
        detail: `${component.quantityPerUnit} / persona × ${line.quantity} = ${component.totalQuantity}`,
      });
    }
  }

  return rows;
}
