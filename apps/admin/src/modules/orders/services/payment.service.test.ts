import { describe, expect, it, vi } from "vitest";

vi.mock("../repositories/payment.repository", () => ({
  getPaymentByIdRepo: vi.fn(),
  confirmPaymentWithStockDeductRepo: vi.fn(),
  updatePaymentRepo: vi.fn(),
}));

vi.mock("../repositories/order.repository", () => ({
  updateOrderPaymentStatusRepo: vi.fn(),
}));

vi.mock("@/modules/catalog/repositories/catalog-cache-meta.repository", () => ({
  bumpCatalogVersionSafe: vi.fn(),
}));

vi.mock("@/shared/errors/server-error", () => ({
  logServerError: vi.fn(),
  logServerInfo: vi.fn(),
}));

import { refundPaymentService } from "./payment.service";

describe("refundPaymentService", () => {
  it("rejects standalone refunds in favor of cancel order", () => {
    const result = refundPaymentService({} as never, {
      paymentId: "00000000-0000-0000-0000-000000000001",
    });

    expect(result).toEqual({ ok: false, error: "USE_CANCEL_ORDER" });
  });
});
