import "server-only";

import type { OrderShoppingCartLine } from "@de-tin-marin/shared/order-cart";
import { getBundleLineChargeableTotal } from "@de-tin-marin/shared/order-cart";
import type { OrderNotifyFulfillment, OrderNotifyLine } from "./types";

function formatPackComponentQty(input: {
  packageQuantity: number;
  unitQuantity: number;
  totalPackages: number;
  totalUnits: number;
}): string {
  const perPack: string[] = [];
  if (input.packageQuantity > 0) {
    perPack.push(`${input.packageQuantity} present.`);
  }
  if (input.unitQuantity > 0) {
    perPack.push(`${input.unitQuantity} und.`);
  }
  const per = perPack.join(" + ") || "—";
  const totals: string[] = [];
  if (input.totalPackages > 0) {
    totals.push(`${input.totalPackages} present. total`);
  }
  if (input.totalUnits > 0) {
    totals.push(`${input.totalUnits} und. total`);
  }
  return totals.length > 0 ? `${per} → ${totals.join(" · ")}` : per;
}

export function mapCartLinesToNotifyLines(
  lines: OrderShoppingCartLine[],
): OrderNotifyLine[] {
  return lines.map((line) => {
    if (line.type === "product") {
      const parts: string[] = [];
      if (line.packageQuantity > 0) {
        parts.push(`${line.packageQuantity} present.`);
      }
      if (line.unitQuantity > 0) {
        parts.push(`${line.unitQuantity} und.`);
      }
      return {
        kind: "product" as const,
        label: line.name,
        quantityLabel: parts.join(" · ") || "1",
        lineTotal: line.lineTotal,
      };
    }

    if (line.type === "pack") {
      return {
        kind: "pack" as const,
        label: line.name,
        quantityLabel: `Combo × ${line.quantity}`,
        lineTotal: line.lineTotal,
        components: line.components.map((component) => ({
          label: component.productName,
          quantityLabel: formatPackComponentQty({
            packageQuantity: component.packageQuantity,
            unitQuantity: component.unitQuantity,
            totalPackages: component.totalPackages,
            totalUnits: component.totalUnits,
          }),
        })),
      };
    }

    const containerNote = line.container
      ? `Incluye envase: ${line.container.name}`
      : null;

    return {
      kind: "bundle" as const,
      label: line.name,
      quantityLabel: `Sorpresa × ${line.quantity}`,
      lineTotal: getBundleLineChargeableTotal(line),
      footnote: containerNote,
      components: line.components.map((component) => {
        const perUnit = component.quantityPerUnit;
        const total = component.totalQuantity;
        const qtyLabel =
          perUnit === total
            ? `${total} und.`
            : `${perUnit} und./sorpresa · ${total} und. total`;
        return {
          label: component.productName,
          quantityLabel: qtyLabel,
        };
      }),
    };
  });
}

export function mapFulfillmentToNotify(input: {
  method: "delivery" | "pickup" | "pickup_point" | "courier";
  deliveryAddress?: {
    recipientName: string;
    line1: string;
    district: string;
    city: string;
    province: string;
    reference?: string | null;
  } | null;
  pickupPoint?: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    fee: number;
  } | null;
  courier?: {
    destination: {
      departmentId: string;
      departmentName: string;
      provinceSlug: string;
      provinceName: string;
    };
    recipient: {
      dni: string;
      fullName: string;
      agencyAddress: string;
    };
  } | null;
}): OrderNotifyFulfillment {
  if (input.method === "pickup") {
    return { method: "pickup", summary: "Recojo en tienda" };
  }

  if (input.method === "pickup_point") {
    const point = input.pickupPoint;
    if (!point) {
      return { method: "pickup_point", summary: null };
    }
    return {
      method: "pickup_point",
      summary: `Punto de recojo: ${point.name}`,
    };
  }

  if (input.method === "courier") {
    const courier = input.courier;
    if (!courier) {
      return { method: "courier", summary: null };
    }
    return {
      method: "courier",
      summary: `${courier.destination.departmentName}, ${courier.destination.provinceName} · ${courier.recipient.fullName} · DNI ${courier.recipient.dni} · ${courier.recipient.agencyAddress}`,
    };
  }

  const address = input.deliveryAddress;
  if (!address) {
    return { method: "delivery", summary: null };
  }

  const parts = [
    address.recipientName,
    address.line1,
    address.district,
    address.city,
    address.province,
  ].filter(Boolean);

  const reference = address.reference?.trim();
  const summary = reference
    ? `${parts.join(", ")} (Ref: ${reference})`
    : parts.join(", ");

  return { method: "delivery", summary };
}
