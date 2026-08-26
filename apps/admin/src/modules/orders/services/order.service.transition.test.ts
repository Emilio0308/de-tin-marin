import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrderByIdRepo = vi.fn();
const updateOrderStatusRepo = vi.fn();
const getShipmentByOrderIdRepo = vi.fn();
const upsertShipmentRepo = vi.fn();
const cancelOrderWithRestockRepo = vi.fn();

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
  bumpCatalogVersionSafe: vi.fn(),
}));

vi.mock("@/shared/errors/server-error", () => ({
  logServerError: vi.fn(),
  logServerInfo: vi.fn(),
}));

vi.mock("../repositories/order.repository", () => ({
  getOrderByIdRepo: (...args: unknown[]): unknown => getOrderByIdRepo(...args),
  updateOrderStatusRepo: (...args: unknown[]): unknown =>
    updateOrderStatusRepo(...args),
  listOrdersRepo: vi.fn(),
  listOrdersPageRepo: vi.fn(),
  countOrdersByDatePrefixRepo: vi.fn(),
  insertOrderRepo: vi.fn(),
  getOrderProductsByIdsRepo: vi.fn(),
  asJson: vi.fn(),
}));

vi.mock("../repositories/shipment.repository", () => ({
  getShipmentByOrderIdRepo: (...args: unknown[]): unknown =>
    getShipmentByOrderIdRepo(...args),
  upsertShipmentRepo: (...args: unknown[]): unknown =>
    upsertShipmentRepo(...args),
}));

import { transitionOrderStatusService } from "./order.service";

const ORDER_ID = "00000000-0000-0000-0000-000000000001";
const STAFF_ID = "00000000-0000-0000-0000-000000000099";

describe("transitionOrderStatusService", () => {
  beforeEach(() => {
    getOrderByIdRepo.mockReset();
    updateOrderStatusRepo.mockReset();
    getShipmentByOrderIdRepo.mockReset();
    upsertShipmentRepo.mockReset();
    cancelOrderWithRestockRepo.mockReset();
  });

  it("rejects in_transit without shipment", async () => {
    getOrderByIdRepo.mockResolvedValue({
      id: ORDER_ID,
      status: "ready",
      fulfillment: { method: "delivery" },
    });

    const result = await transitionOrderStatusService({} as never, STAFF_ID, {
      id: ORDER_ID,
      status: "in_transit",
    });

    expect(result).toEqual({ ok: false, error: "VALIDATION" });
    expect(upsertShipmentRepo).not.toHaveBeenCalled();
    expect(updateOrderStatusRepo).not.toHaveBeenCalled();
  });

  it("upserts shipment then transitions to in_transit", async () => {
    getOrderByIdRepo.mockResolvedValue({
      id: ORDER_ID,
      status: "ready",
      fulfillment: { method: "pickup_point" },
    });
    getShipmentByOrderIdRepo.mockResolvedValue(null);
    upsertShipmentRepo.mockResolvedValue({});
    updateOrderStatusRepo.mockResolvedValue({ id: ORDER_ID });

    const result = await transitionOrderStatusService({} as never, STAFF_ID, {
      id: ORDER_ID,
      status: "in_transit",
      shipment: {
        carrier: "Olva",
        trackingNumber: "TRK-1",
        notes: null,
      },
    });

    expect(result).toEqual({
      ok: true,
      data: { id: ORDER_ID, status: "in_transit" },
    });
    expect(upsertShipmentRepo).toHaveBeenCalledOnce();
    expect(updateOrderStatusRepo).toHaveBeenCalledWith(
      expect.anything(),
      ORDER_ID,
      "in_transit",
    );
  });

  it("rejects ready → awaiting_pickup for delivery", async () => {
    getOrderByIdRepo.mockResolvedValue({
      id: ORDER_ID,
      status: "ready",
      fulfillment: { method: "delivery" },
    });

    const result = await transitionOrderStatusService({} as never, STAFF_ID, {
      id: ORDER_ID,
      status: "awaiting_pickup",
    });

    expect(result).toEqual({ ok: false, error: "INVALID_TRANSITION" });
  });

  it("allows ready → awaiting_pickup for pickup without shipment", async () => {
    getOrderByIdRepo.mockResolvedValue({
      id: ORDER_ID,
      status: "ready",
      fulfillment: { method: "pickup" },
    });
    updateOrderStatusRepo.mockResolvedValue({ id: ORDER_ID });

    const result = await transitionOrderStatusService({} as never, STAFF_ID, {
      id: ORDER_ID,
      status: "awaiting_pickup",
    });

    expect(result).toEqual({
      ok: true,
      data: { id: ORDER_ID, status: "awaiting_pickup" },
    });
    expect(upsertShipmentRepo).not.toHaveBeenCalled();
  });
});
