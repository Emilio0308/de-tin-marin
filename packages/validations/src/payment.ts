import { z } from "zod";

export const confirmPaymentInputSchema = z.object({
  orderId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
  paymentReference: z.string().max(200).optional(),
});

export const refundPaymentInputSchema = z.object({
  paymentId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

export const paymentSummarySchema = z.object({
  id: z.string().uuid(),
  amount: z.number(),
  status: z.enum(["pending", "confirmed", "refunded"]),
  method: z.literal("internal"),
  notes: z.string().nullable(),
  confirmedAt: z.string().nullable(),
  confirmedBy: z.string().uuid().nullable(),
});

export const confirmPaymentResultSchema = z.object({
  orderId: z.string().uuid(),
  paymentId: z.string().uuid(),
  status: z.literal("paid"),
});

export const refundPaymentResultSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.literal("refunded"),
});

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentInputSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentInputSchema>;
export type PaymentSummary = z.infer<typeof paymentSummarySchema>;
export type ConfirmPaymentResult = z.infer<typeof confirmPaymentResultSchema>;
export type RefundPaymentResult = z.infer<typeof refundPaymentResultSchema>;
