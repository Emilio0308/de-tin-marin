import type { CreateOrderInput } from "@de-tin-marin/validations/order";
import type { StoredCartLine } from "../repositories/cart.repository";

export function cartLinesToOrderInput(
  lines: StoredCartLine[],
): CreateOrderInput["lines"] {
  return lines.map((entry) => {
    if (entry.line.type === "product") {
      return {
        type: "product",
        productId: entry.line.productId,
        quantity: entry.line.quantity,
      };
    }

    return {
      type: "bundle",
      bundleId: entry.line.bundleId,
      quantity: entry.line.quantity,
      components: entry.line.components.map((component) => ({
        productId: component.productId,
        quantityPerUnit: component.quantityPerUnit,
      })),
    };
  });
}
