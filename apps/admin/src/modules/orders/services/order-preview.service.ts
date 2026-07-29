import "server-only";

import {
  buildOrderCartWithTotals,
  collectProductIdsFromOrderLines,
  type OrderBundleSource,
} from "@de-tin-marin/shared/build-order-cart";
import { roundMoney } from "@de-tin-marin/shared/prices";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { previewAdminBundleLineInputSchema } from "@de-tin-marin/validations/customize-bundle";
import { previewOrderCartInputSchema } from "@de-tin-marin/validations/order";
import { getBundleByIdRepo } from "@/modules/catalog/repositories/bundle.repository";
import { listCampaignsByIdsRepo } from "@/modules/catalog/repositories/product.repository";
import { getOrderProductsByIdsRepo } from "../repositories/order.repository";

async function resolveBundlesById(
  config: SupabaseConfig,
  lines: Parameters<typeof collectProductIdsFromOrderLines>[0],
): Promise<Map<string, OrderBundleSource>> {
  const bundlesById = new Map<string, OrderBundleSource>();

  for (const line of lines) {
    if (line.type !== "bundle" || bundlesById.has(line.bundleId)) {
      continue;
    }

    const bundle = await getBundleByIdRepo(config, line.bundleId);
    if (!bundle) continue;

    const containerRow = bundle.surprise_containers;
    bundlesById.set(line.bundleId, {
      id: bundle.id,
      name: bundle.name,
      is_active: bundle.is_active,
      deleted_at: bundle.deleted_at,
      container: containerRow
        ? {
            id: containerRow.id,
            sku: containerRow.sku,
            name: containerRow.name,
            prices: containerRow.prices,
          }
        : null,
    });
  }

  return bundlesById;
}

export async function previewAdminBundleLineService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | {
      ok: true;
      data: {
        lineTotal: number;
        itemsSubtotal: number;
        containerSubtotal: number;
        unitPricesByProductId: Record<string, number>;
      };
    }
  | {
      ok: false;
      error:
        | "VALIDATION"
        | "BUNDLE_NOT_FOUND"
        | "PRODUCT_NOT_FOUND"
        | "DUPLICATE_PRODUCT_IN_BUNDLE";
    }
> {
  const parsed = previewAdminBundleLineInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const { bundleId, quantity, components } = parsed.data;
  const bundlesById = await resolveBundlesById(config, [
    { type: "bundle", bundleId, quantity, components },
  ]);

  if (!bundlesById.has(bundleId)) {
    return { ok: false, error: "BUNDLE_NOT_FOUND" };
  }

  const productIds = components.map((component) => component.productId);
  const products = await getOrderProductsByIdsRepo(config, productIds);
  if (products.length !== productIds.length) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  const campaignIds = products
    .map((product) => product.campaign_id)
    .filter((id): id is string => Boolean(id));
  const campaigns = await listCampaignsByIdsRepo(config, campaignIds);

  const cartResult = buildOrderCartWithTotals({
    lines: [{ type: "bundle", bundleId, quantity, components }],
    products,
    campaigns,
    bundlesById,
  });

  if (!cartResult.ok) {
    return { ok: false, error: cartResult.error };
  }

  const bundleLine = cartResult.shoppingCart.lines[0];
  if (!bundleLine || bundleLine.type !== "bundle") {
    return { ok: false, error: "BUNDLE_NOT_FOUND" };
  }

  const itemsSubtotal = roundMoney(
    bundleLine.components.reduce(
      (sum, component) => sum + component.unitPrice * component.totalQuantity,
      0,
    ),
  );
  const containerUnitPrice = bundleLine.container?.unitPrice ?? 0;
  const containerSubtotal = roundMoney(
    containerUnitPrice * bundleLine.quantity,
  );
  const unitPricesByProductId = Object.fromEntries(
    bundleLine.components.map((component) => [
      component.productId,
      component.unitPrice,
    ]),
  );

  return {
    ok: true,
    data: {
      lineTotal: bundleLine.lineTotal,
      itemsSubtotal,
      containerSubtotal,
      unitPricesByProductId,
    },
  };
}

export async function previewOrderCartService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | {
      ok: true;
      data: {
        subtotal: number;
        discountTotal: number;
        shippingTotal: number;
        total: number;
        lineTotals: number[];
      };
    }
  | {
      ok: false;
      error:
        | "VALIDATION"
        | "PRODUCT_NOT_FOUND"
        | "BUNDLE_NOT_FOUND"
        | "DUPLICATE_PRODUCT_IN_BUNDLE";
    }
> {
  const parsed = previewOrderCartInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  if (parsed.data.lines.length === 0) {
    return {
      ok: true,
      data: {
        subtotal: 0,
        discountTotal: parsed.data.discountTotal,
        shippingTotal: parsed.data.shippingTotal,
        total: roundMoney(
          parsed.data.shippingTotal - parsed.data.discountTotal,
        ),
        lineTotals: [],
      },
    };
  }

  const productIds = collectProductIdsFromOrderLines(parsed.data.lines);
  const products = await getOrderProductsByIdsRepo(config, productIds);
  if (products.length !== productIds.length) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  const campaignIds = products
    .map((product) => product.campaign_id)
    .filter((id): id is string => Boolean(id));
  const campaigns = await listCampaignsByIdsRepo(config, campaignIds);
  const bundlesById = await resolveBundlesById(config, parsed.data.lines);

  const cartResult = buildOrderCartWithTotals({
    lines: parsed.data.lines,
    products,
    campaigns,
    bundlesById,
    discountTotal: parsed.data.discountTotal,
    shippingTotal: parsed.data.shippingTotal,
  });

  if (!cartResult.ok) {
    return { ok: false, error: cartResult.error };
  }

  return {
    ok: true,
    data: {
      subtotal: cartResult.totals.subtotal,
      discountTotal: cartResult.totals.discountTotal,
      shippingTotal: cartResult.totals.shippingTotal,
      total: cartResult.totals.total,
      lineTotals: cartResult.shoppingCart.lines.map((line) => line.lineTotal),
    },
  };
}
