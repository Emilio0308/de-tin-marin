import { computeFinalPrice, toCampaignForPricing } from "./final-price";
import {
  buildShoppingCart,
  computeOrderTotals,
  type BuildBundleLineInput,
  type BuildProductLineInput,
  type OrderShoppingCart,
  type OrderTotals,
  type ProductForOrderLine,
} from "./order-cart";
import {
  parseContainerPricesJson,
  parseProductPricesJson,
  roundMoney,
} from "./prices";

export type OrderLineInput =
  | { type: "product"; productId: string; quantity: number }
  | {
      type: "bundle";
      bundleId: string;
      quantity: number;
      components: Array<{ productId: string; quantityPerUnit: number }>;
    };

export type OrderProductSource = {
  id: string;
  sku: string;
  name: string;
  prices: unknown;
  campaign_id: string | null;
  items_per_package: number | null;
};

export type OrderCampaignSource = {
  id: string;
  percentage: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

export type OrderBundleSource = {
  id: string;
  name: string;
  is_active: boolean;
  deleted_at: string | null;
  container: {
    id: string;
    sku: string;
    name: string;
    prices: unknown;
  } | null;
};

export type BuildOrderCartError =
  "PRODUCT_NOT_FOUND" | "BUNDLE_NOT_FOUND" | "DUPLICATE_PRODUCT_IN_BUNDLE";

export function collectProductIdsFromOrderLines(
  lines: OrderLineInput[],
): string[] {
  const ids = new Set<string>();

  for (const line of lines) {
    if (line.type === "product") {
      ids.add(line.productId);
      continue;
    }

    for (const component of line.components) {
      ids.add(component.productId);
    }
  }

  return [...ids];
}

export function resolveProductsForOrder(
  products: OrderProductSource[],
  campaigns: OrderCampaignSource[],
): Map<string, ProductForOrderLine> {
  const campaignsById = new Map(
    campaigns.map((campaign) => [campaign.id, campaign]),
  );

  return new Map(
    products.map((product) => {
      const { packageNetPrice, unitNetPrice } = parseProductPricesJson(
        product.prices,
      );
      const campaignRow = product.campaign_id
        ? (campaignsById.get(product.campaign_id) ?? null)
        : null;
      const itemsPerPackage = product.items_per_package ?? 1;
      const unitPrice = campaignRow
        ? roundMoney(
            computeFinalPrice(
              packageNetPrice,
              toCampaignForPricing(campaignRow),
            ) / itemsPerPackage,
          )
        : unitNetPrice;

      return [
        product.id,
        {
          id: product.id,
          sku: product.sku,
          name: product.name,
          unitPrice,
        },
      ] as const;
    }),
  );
}

function buildEnrichedCartLines(
  lines: OrderLineInput[],
  bundlesById: Map<string, OrderBundleSource>,
): Array<BuildProductLineInput | BuildBundleLineInput> | BuildOrderCartError {
  const buildLines: Array<BuildProductLineInput | BuildBundleLineInput> = [];

  for (const line of lines) {
    if (line.type === "product") {
      buildLines.push(line);
      continue;
    }

    const bundle = bundlesById.get(line.bundleId);
    if (!bundle || !bundle.is_active || bundle.deleted_at) {
      return "BUNDLE_NOT_FOUND";
    }

    const containerRow = bundle.container;
    if (!containerRow) {
      return "BUNDLE_NOT_FOUND";
    }

    const componentIds = line.components.map((item) => item.productId);
    if (new Set(componentIds).size !== componentIds.length) {
      return "DUPLICATE_PRODUCT_IN_BUNDLE";
    }

    buildLines.push({
      type: "bundle",
      bundleId: line.bundleId,
      name: bundle.name,
      quantity: line.quantity,
      container: {
        containerId: containerRow.id,
        sku: containerRow.sku,
        name: containerRow.name,
        unitPrice: parseContainerPricesJson(containerRow.prices).netPrice,
      },
      components: line.components,
    });
  }

  return buildLines;
}

export function buildOrderCart(input: {
  lines: OrderLineInput[];
  products: OrderProductSource[];
  campaigns: OrderCampaignSource[];
  bundlesById: Map<string, OrderBundleSource>;
}):
  | { ok: true; shoppingCart: OrderShoppingCart }
  | { ok: false; error: BuildOrderCartError } {
  const productIds = collectProductIdsFromOrderLines(input.lines);
  if (input.products.length !== productIds.length) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  const productsById = resolveProductsForOrder(input.products, input.campaigns);
  const enrichedLines = buildEnrichedCartLines(input.lines, input.bundlesById);

  if (typeof enrichedLines === "string") {
    return { ok: false, error: enrichedLines };
  }

  try {
    const shoppingCart = buildShoppingCart({
      lines: enrichedLines,
      productsById,
    });
    return { ok: true, shoppingCart };
  } catch {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }
}

export function buildOrderCartWithTotals(input: {
  lines: OrderLineInput[];
  products: OrderProductSource[];
  campaigns: OrderCampaignSource[];
  bundlesById: Map<string, OrderBundleSource>;
  discountTotal?: number;
  shippingTotal?: number;
}):
  | { ok: true; shoppingCart: OrderShoppingCart; totals: OrderTotals }
  | { ok: false; error: BuildOrderCartError } {
  const cartResult = buildOrderCart(input);
  if (!cartResult.ok) {
    return cartResult;
  }

  const totals = computeOrderTotals(cartResult.shoppingCart, {
    discountTotal: input.discountTotal,
    shippingTotal: input.shippingTotal,
  });

  return {
    ok: true,
    shoppingCart: cartResult.shoppingCart,
    totals,
  };
}
