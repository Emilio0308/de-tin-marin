import type { GuestOrderDetail } from "@de-tin-marin/validations/guest-order";
import type { GuestOrderLineSummary } from "./guest-order-detail.types";

export function summarizeGuestOrderLines(
  order: GuestOrderDetail,
  labels: {
    bundleComponents: string;
    packComponents: string;
    formatBundlePersons: (count: number) => string;
  },
): GuestOrderLineSummary[] {
  return order.shoppingCart.lines.map((line) => {
    if (line.type === "product") {
      return {
        key: line.productId,
        kind: "product" as const,
        name: line.name,
        detail: `${line.packageQuantity} ud.`,
        lineTotal: line.lineTotal,
      };
    }

    if (line.type === "pack") {
      return {
        key: line.packId,
        kind: "pack" as const,
        name: line.name,
        detail: `${line.quantity} ud. · ${line.components.length} ${labels.packComponents}`,
        lineTotal: line.lineTotal,
      };
    }

    return {
      key: line.bundleId,
      kind: "bundle" as const,
      name: line.name,
      detail: `${labels.formatBundlePersons(line.quantity)} · ${line.components.length} ${labels.bundleComponents}`,
      lineTotal: line.lineTotal,
    };
  });
}

export function formatGuestOrderDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function resolveFulfillmentTitle(
  method: GuestOrderDetail["fulfillment"]["method"],
  labels: {
    deliveryTitle: string;
    pickupTitle: string;
    pickupPointTitle: string;
  },
): string {
  if (method === "pickup") return labels.pickupTitle;
  if (method === "pickup_point") return labels.pickupPointTitle;
  return labels.deliveryTitle;
}

export function formatDeliveryAddress(order: GuestOrderDetail): string | null {
  const address = order.fulfillment.deliveryAddress;
  if (!address) return null;

  const parts = [
    address.line1,
    address.district,
    address.city,
    address.province,
    address.reference,
  ].filter(Boolean);

  return parts.join(", ");
}

export function formatPickupPoint(order: GuestOrderDetail): string | null {
  const point = order.fulfillment.pickupPoint;
  if (!point) return null;
  return point.name;
}

export function resolveFulfillmentDetail(
  order: GuestOrderDetail,
  labels: { pickupInStoreNote: string },
): string | null {
  if (order.fulfillment.method === "pickup_point") {
    return formatPickupPoint(order);
  }
  if (order.fulfillment.method === "delivery") {
    return formatDeliveryAddress(order);
  }
  return labels.pickupInStoreNote;
}
