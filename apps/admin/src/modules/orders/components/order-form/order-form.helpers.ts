import {
  buildShoppingCart,
  computeOrderTotals,
  type BuildBundleLineInput,
  type BuildProductLineInput,
} from "@de-tin-marin/shared/order-cart";
import type {
  OrderFormLine,
  OrderFormValues,
  ProductOption,
} from "./order-form.types";

export function previewOrderTotals(
  values: Pick<OrderFormValues, "lines" | "shippingTotal" | "discountTotal">,
  products: ProductOption[],
  bundlesById: Map<
    string,
    {
      name: string;
      container: {
        containerId: string;
        sku: string;
        name: string;
        unitPrice: number;
      };
    }
  >,
) {
  if (values.lines.length === 0) {
    return computeOrderTotals({ lines: [] }, values);
  }

  const productsById = new Map(
    products.map((product) => [
      product.id,
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        unitPrice: product.finalPrice,
      },
    ]),
  );

  const buildLines: Array<BuildProductLineInput | BuildBundleLineInput> = [];

  for (const line of values.lines) {
    if (line.type === "product") {
      buildLines.push(line);
      continue;
    }

    const bundle = bundlesById.get(line.bundleId);
    if (!bundle) continue;

    buildLines.push({
      type: "bundle",
      bundleId: line.bundleId,
      name: bundle.name,
      quantity: line.quantity,
      container: bundle.container,
      components: line.components,
    });
  }

  if (buildLines.length === 0) {
    return computeOrderTotals({ lines: [] }, values);
  }

  try {
    const shoppingCart = buildShoppingCart({ lines: buildLines, productsById });
    return computeOrderTotals(shoppingCart, {
      shippingTotal: values.shippingTotal,
      discountTotal: values.discountTotal,
    });
  } catch {
    return null;
  }
}

export function toCreateOrderPayload(values: OrderFormValues) {
  return {
    contact: values.contact,
    fulfillment: {
      method: values.fulfillment.method,
      deliveryAddress:
        values.fulfillment.method === "delivery"
          ? {
              ...values.fulfillment.deliveryAddress,
              reference: values.fulfillment.deliveryAddress.reference || null,
            }
          : undefined,
      notes: values.fulfillment.notes || null,
    },
    lines: values.lines.map((line) =>
      line.type === "product"
        ? line
        : {
            type: "bundle" as const,
            bundleId: line.bundleId,
            quantity: line.quantity,
            components: line.components,
          },
    ),
    shippingTotal: values.shippingTotal,
    discountTotal: values.discountTotal,
  };
}

export function createBundleLineFromTemplate(
  bundleId: string,
  quantity: number,
  items: Array<{ productId: string; unitsPerPerson: number }>,
): OrderFormLine {
  return {
    type: "bundle",
    bundleId,
    quantity,
    components: items.map((item) => ({
      productId: item.productId,
      quantityPerUnit: item.unitsPerPerson,
    })),
  };
}
