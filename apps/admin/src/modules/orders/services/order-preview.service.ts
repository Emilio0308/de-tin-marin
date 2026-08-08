import "server-only";

import {
  buildOrderCartWithTotals,
  collectPackIdsFromOrderLines,
  collectProductIdsFromOrderLines,
  type OrderBundleSource,
  type OrderPackSource,
} from "@de-tin-marin/shared/build-order-cart";
import { roundMoney } from "@de-tin-marin/shared/prices";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { previewAdminBundleLineInputSchema } from "@de-tin-marin/validations/customize-bundle";
import { previewOrderCartInputSchema } from "@de-tin-marin/validations/order";
import { getBundleByIdRepo } from "@/modules/catalog/repositories/bundle.repository";
import { getPackByIdRepo } from "@/modules/catalog/repositories/pack.repository";
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

async function resolvePacksById(
  config: SupabaseConfig,
  lines: Parameters<typeof collectProductIdsFromOrderLines>[0],
): Promise<Map<string, OrderPackSource>> {
  const packsById = new Map<string, OrderPackSource>();

  for (const packId of collectPackIdsFromOrderLines(lines)) {
    const pack = await getPackByIdRepo(config, packId);
    if (!pack) continue;

    packsById.set(packId, {
      id: pack.id,
      sku: pack.sku,
      name: pack.name,
      prices: pack.prices,
      campaign_id: pack.campaign_id,
      image_url: pack.image_url,
      is_active: pack.is_active,
      deleted_at: pack.deleted_at,
      items: (pack.pack_items ?? []).map((item) => ({
        product_id: item.product_id,
        package_quantity: item.package_quantity,
        unit_quantity: item.unit_quantity ?? 0,
      })),
    });
  }

  return packsById;
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
    if (cartResult.error === "PACK_NOT_FOUND") {
      return { ok: false, error: "BUNDLE_NOT_FOUND" };
    }
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
        surchargeTotal: number;
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
        | "PACK_NOT_FOUND"
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
        surchargeTotal: parsed.data.surchargeTotal,
        shippingTotal: parsed.data.shippingTotal,
        total: roundMoney(
          parsed.data.shippingTotal -
            parsed.data.discountTotal +
            parsed.data.surchargeTotal,
        ),
        lineTotals: [],
      },
    };
  }

  const packsById = await resolvePacksById(config, parsed.data.lines);
  for (const line of parsed.data.lines) {
    if (line.type === "pack" && !packsById.has(line.packId)) {
      return { ok: false, error: "PACK_NOT_FOUND" };
    }
  }

  const productIds = collectProductIdsFromOrderLines(
    parsed.data.lines,
    packsById,
  );
  const products = await getOrderProductsByIdsRepo(config, productIds);
  if (products.length !== productIds.length) {
    return { ok: false, error: "PRODUCT_NOT_FOUND" };
  }

  const campaignIds = [
    ...products
      .map((product) => product.campaign_id)
      .filter((id): id is string => Boolean(id)),
    ...[...packsById.values()]
      .map((pack) => pack.campaign_id)
      .filter((id): id is string => Boolean(id)),
  ];
  const campaigns = await listCampaignsByIdsRepo(config, campaignIds);
  const bundlesById = await resolveBundlesById(config, parsed.data.lines);

  const cartResult = buildOrderCartWithTotals({
    lines: parsed.data.lines,
    products,
    campaigns,
    bundlesById,
    packsById,
    discountTotal: parsed.data.discountTotal,
    surchargeTotal: parsed.data.surchargeTotal,
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
      surchargeTotal: cartResult.totals.surchargeTotal,
      shippingTotal: cartResult.totals.shippingTotal,
      total: cartResult.totals.total,
      lineTotals: cartResult.shoppingCart.lines.map((line) => line.lineTotal),
    },
  };
}
