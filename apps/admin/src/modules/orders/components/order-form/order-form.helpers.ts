import {
  buildShoppingCart,
  computeOrderTotals,
  type BuildBundleLineInput,
  type BuildProductLineInput,
  type OrderShoppingCartLine,
  type ProductForOrderLine,
} from "@de-tin-marin/shared/order-cart";
import type {
  OrderFormLine,
  OrderFormValues,
  ProductOption,
} from "./order-form.types";

type BundleMeta = {
  name: string;
  container: {
    containerId: string;
    sku: string;
    name: string;
    unitPrice: number;
  };
};

function buildProductsByIdForLine(
  line: OrderFormLine,
  products: ProductOption[],
): Map<string, ProductForOrderLine> {
  const map = new Map<string, ProductForOrderLine>();

  if (line.type === "product") {
    const product = products.find((item) => item.id === line.productId);
    if (product) {
      map.set(product.id, {
        id: product.id,
        sku: product.sku,
        name: product.name,
        unitPrice: product.finalPrice,
      });
    }
    return map;
  }

  const componentIds = new Set(
    line.components.map((component) => component.productId),
  );
  for (const product of products) {
    if (!componentIds.has(product.id)) continue;
    map.set(product.id, {
      id: product.id,
      sku: product.sku,
      name: product.name,
      unitPrice: product.finalUnitPrice,
    });
  }

  return map;
}

function toBuildLine(
  line: OrderFormLine,
  bundlesById: Map<string, BundleMeta>,
): BuildProductLineInput | BuildBundleLineInput | null {
  if (line.type === "product") {
    return line;
  }

  const bundle = bundlesById.get(line.bundleId);
  if (!bundle) return null;

  return {
    type: "bundle",
    bundleId: line.bundleId,
    name: bundle.name,
    quantity: line.quantity,
    container: bundle.container,
    components: line.components,
  };
}

/** Fallback cliente cuando el preview server no está disponible. */
export function estimateOrderFormLineTotal(
  line: OrderFormLine,
  products: ProductOption[],
  bundlesById: Map<string, BundleMeta>,
): number | null {
  const buildLine = toBuildLine(line, bundlesById);
  if (!buildLine) return null;

  const productsById = buildProductsByIdForLine(line, products);

  try {
    const shoppingCart = buildShoppingCart({
      lines: [buildLine],
      productsById,
    });
    return shoppingCart.lines[0]?.lineTotal ?? null;
  } catch {
    return null;
  }
}

/** Fallback cliente cuando el preview server no está disponible. */
export function previewOrderTotals(
  values: Pick<OrderFormValues, "lines" | "shippingTotal" | "discountTotal">,
  products: ProductOption[],
  bundlesById: Map<string, BundleMeta>,
) {
  if (values.lines.length === 0) {
    return computeOrderTotals({ lines: [] }, values);
  }

  const builtLines: OrderShoppingCartLine[] = [];

  try {
    for (const line of values.lines) {
      const buildLine = toBuildLine(line, bundlesById);
      if (!buildLine) continue;

      const shoppingCart = buildShoppingCart({
        lines: [buildLine],
        productsById: buildProductsByIdForLine(line, products),
      });
      const built = shoppingCart.lines[0];
      if (built) builtLines.push(built);
    }

    return computeOrderTotals(
      { lines: builtLines },
      {
        shippingTotal: values.shippingTotal,
        discountTotal: values.discountTotal,
      },
    );
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

export type { BundleMeta };
