import type { CreateOrderInput } from "@de-tin-marin/validations/order";
import type { StoredCartLine } from "../repositories/cart.repository";

export function cartLinesToOrderInput(
  lines: StoredCartLine[],
): CreateOrderInput["lines"] {
  return lines.map((entry) => {
    if (entry.line.type === "product") {
      return {
        type: "product" as const,
        productId: entry.line.productId,
        packageQuantity: entry.line.packageQuantity,
        unitQuantity: 0,
      };
    }

    if (entry.line.type === "pack") {
      return {
        type: "pack" as const,
        packId: entry.line.packId,
        quantity: entry.line.quantity,
      };
    }

    return {
      type: "bundle" as const,
      bundleId: entry.line.bundleId,
      quantity: entry.line.quantity,
      components: entry.line.components.map((component) => ({
        productId: component.productId,
        quantityPerUnit: component.quantityPerUnit,
      })),
    };
  });
}
