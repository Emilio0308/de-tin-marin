import { describe, expect, it, vi } from "vitest";

import { notifyOrderCreated } from "./notify-order-created";
import type { OrderCreatedNotifyInput, SmtpConfig } from "./types";

const smtp: SmtpConfig = {
  host: "smtp.gmail.com",
  port: 587,
  user: "u@g.com",
  pass: "secret",
  from: "De Tin <u@g.com>",
};

const ecommerceInput: OrderCreatedNotifyInput = {
  source: "ecommerce",
  orderId: "id-1",
  orderNumber: "TM-1",
  total: 20,
  currencyCode: "PEN",
  subtotal: 18,
  shippingTotal: 2,
  discountTotal: 0,
  statusLabel: "Pendiente de pago",
  contact: {
    name: "Ana",
    lastName: "Ruiz",
    email: "ana@example.com",
    phone: "999888777",
  },
  lines: [
    {
      kind: "pack",
      label: "Pack fiesta",
      quantityLabel: "Combo × 1",
      lineTotal: 18,
      components: [
        { label: "Gomitas", quantityLabel: "1 present. → 1 present. total" },
      ],
    },
  ],
  fulfillment: { method: "delivery", summary: "Calle 1, Piura" },
  adminEmail: "admin@shop.com",
  extraAdminEmails: ["erivasruiz03@gmail.com"],
};

describe("notifyOrderCreated", () => {
  it("skip si smtp es null", async () => {
    const sendMailFn = vi.fn();
    const result = await notifyOrderCreated(null, ecommerceInput, {
      sendMailFn,
    });
    expect(result).toEqual({ ok: true, sent: 0, skipped: true });
    expect(sendMailFn).not.toHaveBeenCalled();
  });

  it("ecommerce envía cliente + cada admin", async () => {
    const sendMailFn = vi.fn().mockResolvedValue(undefined);
    const result = await notifyOrderCreated(smtp, ecommerceInput, {
      sendMailFn,
    });
    expect(result).toEqual({ ok: true, sent: 3, skipped: false });
    expect(sendMailFn).toHaveBeenCalledTimes(3);
    const tos = sendMailFn.mock.calls.map(
      (call: unknown[]) => (call[1] as { to: string }).to,
    );
    expect(tos).toEqual([
      "ana@example.com",
      "admin@shop.com",
      "erivasruiz03@gmail.com",
    ]);
  });

  it("admin no envía al cliente", async () => {
    const sendMailFn = vi.fn().mockResolvedValue(undefined);
    const result = await notifyOrderCreated(
      smtp,
      { ...ecommerceInput, source: "admin" },
      { sendMailFn },
    );
    expect(result).toEqual({ ok: true, sent: 2, skipped: false });
    const tos = sendMailFn.mock.calls.map(
      (call: unknown[]) => (call[1] as { to: string }).to,
    );
    expect(tos).toEqual(["admin@shop.com", "erivasruiz03@gmail.com"]);
  });

  it("retorna ok:false si sendMail falla (sin throw)", async () => {
    const sendMailFn = vi.fn().mockRejectedValue(new Error("SMTP down"));
    const result = await notifyOrderCreated(smtp, ecommerceInput, {
      sendMailFn,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("SMTP down");
    }
  });
});
