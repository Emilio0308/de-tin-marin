import { describe, expect, it } from "vitest";
import { confirmPaymentInputSchema, refundPaymentInputSchema } from "./payment";

describe("confirmPaymentInputSchema", () => {
  it("requires a valid orderId", () => {
    const result = confirmPaymentInputSchema.safeParse({
      orderId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional notes and paymentReference", () => {
    const orderId = crypto.randomUUID();
    const result = confirmPaymentInputSchema.safeParse({
      orderId,
      notes: "Yape confirmado",
      paymentReference: "Yape 999888777",
    });
    expect(result.success).toBe(true);
  });
});

describe("refundPaymentInputSchema", () => {
  it("requires a valid paymentId", () => {
    const result = refundPaymentInputSchema.safeParse({
      paymentId: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional notes", () => {
    const result = refundPaymentInputSchema.safeParse({
      paymentId: crypto.randomUUID(),
      notes: "Cliente solicitó devolución",
    });
    expect(result.success).toBe(true);
  });
});
