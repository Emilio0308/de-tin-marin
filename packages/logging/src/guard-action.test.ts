import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger";
import { createServerErrorHelpers } from "./server-error";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createLogger", () => {
  it("writes JSON info lines to console", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = createLogger({ app: "ecommerce" });

    logger.info("scope.a", "hello", { lineCount: 2, contact: { x: 1 } });

    expect(info).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(info.mock.calls[0]?.[0])) as {
      app: string;
      scope: string;
      message: string;
      meta: Record<string, unknown>;
    };
    expect(payload.app).toBe("ecommerce");
    expect(payload.scope).toBe("scope.a");
    expect(payload.message).toBe("hello");
    expect(payload.meta).toEqual({ lineCount: 2, contact: "[Redacted]" });
  });
});

describe("guardAction", () => {
  it("emits started/completed for ok results", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const { guardAction } = createServerErrorHelpers({
      app: "admin",
      includeUnexpectedMessage: true,
    });

    const result = await guardAction("createOrderAction", () =>
      Promise.resolve({
        ok: true as const,
        data: { id: "1" },
      }),
    );

    expect(result).toEqual({ ok: true, data: { id: "1" } });
    expect(info).toHaveBeenCalledTimes(2);
    const started = JSON.parse(String(info.mock.calls[0]?.[0])) as {
      event: string;
    };
    const completed = JSON.parse(String(info.mock.calls[1]?.[0])) as {
      event: string;
      ok: boolean;
      durationMs: number;
      requestId: string;
      meta: { response: { ok: boolean; id?: string } };
    };
    expect(started.event).toBe("started");
    expect(completed.event).toBe("completed");
    expect(completed.ok).toBe(true);
    expect(completed.requestId).toMatch(/^[0-9a-f]{8}$/i);
    expect(completed.durationMs).toBeGreaterThanOrEqual(0);
    expect(completed.meta.response).toMatchObject({ ok: true, id: "1" });
  });

  it("includes request meta and district list on completed zones", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const { guardAction } = createServerErrorHelpers({
      app: "ecommerce",
      includeUnexpectedMessage: false,
    });

    await guardAction(
      "listCheckoutDeliveryZonesAction",
      () =>
        Promise.resolve({
          ok: true as const,
          data: [{ id: "1", district: "Piura", fee: 8 }],
        }),
      { operation: "list_delivery_zones" },
    );

    const started = JSON.parse(String(info.mock.calls[0]?.[0])) as {
      meta: { request: { operation: string } };
    };
    const completed = JSON.parse(String(info.mock.calls[1]?.[0])) as {
      meta: {
        request: { operation: string };
        response: { itemCount: number; districts: string[] };
      };
    };
    expect(started.meta.request.operation).toBe("list_delivery_zones");
    expect(completed.meta.request.operation).toBe("list_delivery_zones");
    expect(completed.meta.response.itemCount).toBe(1);
    expect(completed.meta.response.districts).toEqual(["Piura"]);
  });

  it("emits completed with errorCode for business failures", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { guardAction } = createServerErrorHelpers({
      app: "ecommerce",
      includeUnexpectedMessage: false,
    });

    const result = await guardAction("createGuestOrderAction", () =>
      Promise.resolve({
        ok: false as const,
        error: "VALIDATION" as const,
      }),
    );

    expect(result).toEqual({ ok: false, error: "VALIDATION" });
    const completed = JSON.parse(String(error.mock.calls[0]?.[0])) as {
      event: string;
      ok: boolean;
      errorCode: string;
    };
    // started is info; completed with ok:false uses error level
    expect(completed.event).toBe("completed");
    expect(completed.ok).toBe(false);
    expect(completed.errorCode).toBe("VALIDATION");
  });

  it("emits failed and omits message for ecommerce UNEXPECTED", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { guardAction } = createServerErrorHelpers({
      app: "ecommerce",
      includeUnexpectedMessage: false,
    });

    const result = await guardAction("createGuestOrderAction", () =>
      Promise.reject(new Error("relation does not exist")),
    );

    expect(result).toEqual({ ok: false, error: "UNEXPECTED" });
    expect("message" in result).toBe(false);
    expect(error.mock.calls.length).toBeGreaterThanOrEqual(2);
    const failed = JSON.parse(String(error.mock.calls[0]?.[0])) as {
      event: string;
      errorCode: string;
    };
    expect(failed.event).toBe("failed");
    expect(failed.errorCode).toBe("UNEXPECTED");
  });

  it("includes message for admin UNEXPECTED", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { guardAction } = createServerErrorHelpers({
      app: "admin",
      includeUnexpectedMessage: true,
    });

    const result = await guardAction("createOrderAction", () =>
      Promise.reject(new Error("boom")),
    );

    expect(result).toEqual({
      ok: false,
      error: "UNEXPECTED",
      message: "boom",
    });
  });
});
