import { computeFinalPrice, toCampaignForPricing } from "./final-price";
import {
  buildShoppingCart,
  computeOrderTotals,
  type BuildBundleLineInput,
  type BuildPackLineInput,
  type BuildProductLineInput,
  type OrderShoppingCart,
  type OrderTotals,
  type ProductForOrderLine,
} from "./order-cart";
import {
  parseContainerPricesJson,
  parsePackPricesJson,
  parseProductPricesJson,
  roundMoney,
} from "./prices";

export type OrderLineInput =
  | {
      type: "product";
      productId: string;
      packageQuantity: number;
      unitQuantity: number;
    }
  | {
      type: "bundle";
      bundleId: string;
      quantity: number;
      components: Array<{ productId: string; quantityPerUnit: number }>;
    }
  | { type: "pack"; packId: string; quantity: number };

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

export type OrderPackSource = {
  id: string;
  sku: string;
  name: string;
  prices: unknown;
  campaign_id: string | null;
  image_url: string | null;
  is_active: boolean;
  deleted_at: string | null;
  items: Array<{
    product_id: string;
    package_quantity: number;
    unit_quantity: number;
  }>;
};

export type BuildOrderCartError =
  | "PRODUCT_NOT_FOUND"
  | "BUNDLE_NOT_FOUND"
  | "PACK_NOT_FOUND"
  | "DUPLICATE_PRODUCT_IN_BUNDLE";

export function collectProductIdsFromOrderLines(
  lines: OrderLineInput[],
  packsById?: Map<string, OrderPackSource>,
): string[] {
  const ids = new Set<string>();

  for (const line of lines) {
    if (line.type === "product") {
      ids.add(line.productId);
      continue;
    }

    if (line.type === "pack") {
      const pack = packsById?.get(line.packId);
      if (pack) {
        for (const item of pack.items) {
          ids.add(item.product_id);
        }
      }
      continue;
    }

    for (const component of line.components) {
      ids.add(component.productId);
    }
  }

  return [...ids];
}

export function collectPackIdsFromOrderLines(
  lines: OrderLineInput[],
): string[] {
  return [
    ...new Set(
      lines.filter((line) => line.type === "pack").map((line) => line.packId),
    ),
  ];
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
      const presentationPrice = roundMoney(
        campaignRow
          ? computeFinalPrice(
              packageNetPrice,
              toCampaignForPricing(campaignRow),
            )
          : packageNetPrice,
      );
      const unitPrice = roundMoney(
        campaignRow ? presentationPrice / itemsPerPackage : unitNetPrice,
      );

      return [
        product.id,
        {
          id: product.id,
          sku: product.sku,
          name: product.name,
          unitPrice,
          presentationPrice,
          itemsPerPackage,
        },
      ] as const;
    }),
  );
}

function resolvePackUnitPrice(
  pack: OrderPackSource,
  campaignsById: Map<string, OrderCampaignSource>,
): number {
  const { normalNetPrice } = parsePackPricesJson(pack.prices);
  const campaignRow = pack.campaign_id
    ? (campaignsById.get(pack.campaign_id) ?? null)
    : null;
  return roundMoney(
    campaignRow
      ? computeFinalPrice(normalNetPrice, toCampaignForPricing(campaignRow))
      : normalNetPrice,
  );
}

function buildEnrichedCartLines(
  lines: OrderLineInput[],
  bundlesById: Map<string, OrderBundleSource>,
  packsById: Map<string, OrderPackSource>,
  campaignsById: Map<string, OrderCampaignSource>,
):
  | Array<BuildProductLineInput | BuildBundleLineInput | BuildPackLineInput>
  | BuildOrderCartError {
  const buildLines: Array<
    BuildProductLineInput | BuildBundleLineInput | BuildPackLineInput
  > = [];

  for (const line of lines) {
    if (line.type === "product") {
      buildLines.push(line);
      continue;
    }

    if (line.type === "pack") {
      const pack = packsById.get(line.packId);
      if (!pack || !pack.is_active || pack.deleted_at) {
        return "PACK_NOT_FOUND";
      }
      if (pack.items.length === 0) {
        return "PACK_NOT_FOUND";
      }

      buildLines.push({
        type: "pack",
        packId: pack.id,
        quantity: line.quantity,
        pack: {
          id: pack.id,
          sku: pack.sku,
          name: pack.name,
          unitPrice: resolvePackUnitPrice(pack, campaignsById),
          imageUrl: pack.image_url,
        },
        components: pack.items.map((item) => ({
          productId: item.product_id,
          packageQuantity: item.package_quantity,
          unitQuantity: item.unit_quantity ?? 0,
        })),
      });
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
  packsById?: Map<string, OrderPackSource>;
}):
  | { ok: true; shoppingCart: OrderShoppingCart }
  | { ok: false; error: BuildOrderCartError } {
  const packsById = input.packsById ?? new Map<string, OrderPackSource>();
  const productIds = collectProductIdsFromOrderLines(input.lines, packsById);
  const productIdSet = new Set(input.products.map((p) => p.id));
  for (const id of productIds) {
    if (!productIdSet.has(id)) {
      return { ok: false, error: "PRODUCT_NOT_FOUND" };
    }
  }

  const campaignsById = new Map(
    input.campaigns.map((campaign) => [campaign.id, campaign]),
  );
  const productsById = resolveProductsForOrder(input.products, input.campaigns);
  const enrichedLines = buildEnrichedCartLines(
    input.lines,
    input.bundlesById,
    packsById,
    campaignsById,
  );

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
  packsById?: Map<string, OrderPackSource>;
  discountTotal?: number;
  surchargeTotal?: number;
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
    surchargeTotal: input.surchargeTotal,
    shippingTotal: input.shippingTotal,
  });

  return {
    ok: true,
    shoppingCart: cartResult.shoppingCart,
    totals,
  };
}
