import { beforeEach, describe, expect, it, vi } from "vitest";

const cancelOrderWithRestockRepo = vi.fn();
const bumpCatalogVersionSafe = vi.fn();

vi.mock("@/config/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    NEXT_PUBLIC_MEDIA_CDN_BASE_URL: "http://cdn",
    SUPABASE_SERVICE_ROLE_KEY: "service",
  },
  supabaseConfig: {},
}));

vi.mock("../helpers/schedule-order-created-notification", () => ({
  scheduleOrderCreatedNotification: vi.fn(),
}));

vi.mock("../repositories/payment.repository", () => ({
  cancelOrderWithRestockRepo: (...args: unknown[]): unknown =>
    cancelOrderWithRestockRepo(...args),
}));

vi.mock("@/modules/catalog/repositories/catalog-cache-meta.repository", () => ({
  bumpCatalogVersionSafe: (...args: unknown[]): unknown =>
    bumpCatalogVersionSafe(...args),
}));

vi.mock("@/shared/errors/server-error", () => ({
  logServerError: vi.fn(),
  logServerInfo: vi.fn(),
}));

vi.mock("../repositories/order.repository", () => ({
  getOrderByIdRepo: vi.fn(),
  updateOrderStatusRepo: vi.fn(),
  listOrdersRepo: vi.fn(),
  listOrdersPageRepo: vi.fn(),
  countOrdersByDatePrefixRepo: vi.fn(),
  insertOrderRepo: vi.fn(),
  getOrderProductsByIdsRepo: vi.fn(),
  asJson: vi.fn(),
}));

import { cancelOrderService } from "./order.service";

describe("cancelOrderService", () => {
  beforeEach(() => {
    cancelOrderWithRestockRepo.mockReset();
    bumpCatalogVersionSafe.mockReset();
  });

  it("calls cancel RPC and bumps catalog when restocked", async () => {
    cancelOrderWithRestockRepo.mockResolvedValue({
      orderId: "00000000-0000-0000-0000-000000000001",
      status: "cancelled",
      restocked: true,
      idempotent: false,
    });

    const result = await cancelOrderService(
      {} as never,
      "00000000-0000-0000-0000-000000000099",
      "00000000-0000-0000-0000-000000000001",
    );

    expect(result).toEqual({
      ok: true,
      data: {
        id: "00000000-0000-0000-0000-000000000001",
        status: "cancelled",
      },
    });
    expect(bumpCatalogVersionSafe).toHaveBeenCalledOnce();
  });

  it("does not bump catalog when cancel does not restock", async () => {
    cancelOrderWithRestockRepo.mockResolvedValue({
      orderId: "00000000-0000-0000-0000-000000000001",
      status: "cancelled",
      restocked: false,
      idempotent: false,
    });

    await cancelOrderService(
      {} as never,
      "00000000-0000-0000-0000-000000000099",
      "00000000-0000-0000-0000-000000000001",
    );

    expect(bumpCatalogVersionSafe).not.toHaveBeenCalled();
  });
});
