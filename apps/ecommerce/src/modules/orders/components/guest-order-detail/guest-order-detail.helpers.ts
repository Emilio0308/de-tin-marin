import type { GuestOrderDetail } from "@de-tin-marin/validations/guest-order";
import type { GuestOrderLineSummary } from "./guest-order-detail.types";

export function summarizeGuestOrderLines(
  order: GuestOrderDetail,
  labels: {
    bundleComponents: string;
    formatBundlePersons: (count: number) => string;
  },
): GuestOrderLineSummary[] {
  return order.shoppingCart.lines.map((line) => {
    if (line.type === "product") {
      return {
        key: line.productId,
        kind: "product",
        name: line.name,
        detail: `${line.quantity} ud.`,
        lineTotal: line.lineTotal,
      };
    }

    return {
      key: line.bundleId,
      kind: "bundle",
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
  labels: { deliveryTitle: string; pickupTitle: string },
): string {
  return method === "pickup" ? labels.pickupTitle : labels.deliveryTitle;
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
