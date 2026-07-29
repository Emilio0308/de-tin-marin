import { describe, expect, it, vi, beforeEach } from "vitest";
import { previewAdminBundleLineService } from "./order-preview.service";

vi.mock("@/modules/catalog/repositories/bundle.repository", () => ({
  getBundleByIdRepo: vi.fn(),
}));

vi.mock("@/modules/catalog/repositories/product.repository", () => ({
  listCampaignsByIdsRepo: vi.fn(),
}));

vi.mock("../repositories/order.repository", () => ({
  getOrderProductsByIdsRepo: vi.fn(),
}));

import { getBundleByIdRepo } from "@/modules/catalog/repositories/bundle.repository";
import { listCampaignsByIdsRepo } from "@/modules/catalog/repositories/product.repository";
import { getOrderProductsByIdsRepo } from "../repositories/order.repository";

const config = {} as never;

const productIds = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
  "00000000-0000-4000-8000-000000000005",
  "00000000-0000-4000-8000-000000000006",
  "00000000-0000-4000-8000-000000000007",
  "00000000-0000-4000-8000-000000000008",
];

const bundleId = "11111111-1111-4111-8111-111111111111";

function buildComponents() {
  return productIds.map((productId) => ({
    productId,
    quantityPerUnit: 1,
  }));
}

describe("previewAdminBundleLineService", () => {
  beforeEach(() => {
    vi.mocked(getBundleByIdRepo).mockResolvedValue({
      id: bundleId,
      name: "Sorpresa test",
      is_active: true,
      deleted_at: null,
      surprise_containers: {
        id: "22222222-2222-4222-8222-222222222222",
        sku: "BOX-M",
        name: "Caja mediana",
        prices: { netPrice: 10, taxRate: 0.18 },
      },
    } as never);

    vi.mocked(getOrderProductsByIdsRepo).mockResolvedValue(
      productIds.map((id, index) => ({
        id,
        sku: `SKU-${index}`,
        name: `Producto ${index}`,
        prices: { normal: { netPrice: 20 }, unit: { netPrice: 2 } },
        campaign_id: null,
        items_per_package: 10,
      })),
    );

    vi.mocked(listCampaignsByIdsRepo).mockResolvedValue([]);
  });

  it("respeta quantity editable distinta al template", async () => {
    const result = await previewAdminBundleLineService(config, {
      bundleId,
      quantity: 3,
      components: buildComponents(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // dulces: 2 * 1 * 3 * 8 = 48; envases: 10 * 3 = 30 → 78
    expect(result.data.lineTotal).toBe(78);
    expect(result.data.containerSubtotal).toBe(30);
    expect(result.data.itemsSubtotal).toBe(48);
  });

  it("rechaza composición inválida", async () => {
    const result = await previewAdminBundleLineService(config, {
      bundleId,
      quantity: 1,
      components: buildComponents().slice(0, 3),
    });

    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });
});
