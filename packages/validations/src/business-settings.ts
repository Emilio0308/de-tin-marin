import { z } from "zod";

const holderNameSchema = z.string().trim().min(2).max(200);

const bankAccountNumberSchema = z.string().trim().min(5).max(40);

/** Digits only E.164 without leading +. */
export const whatsappE164Schema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{10,14}$/);

/** Peruvian mobile for Yape (9XXXXXXXX). */
export const yapePhoneSchema = z
  .string()
  .trim()
  .regex(/^9[0-9]{8}$/);

/** CCI Peru — 20 digits. */
export const bankInterbankAccountNumberSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{20}$/);

export const businessSettingsSchema = z.object({
  whatsappE164: whatsappE164Schema,
  email: z.string().trim().email().max(320),
  yapePhone: yapePhoneSchema,
  yapeHolderName: holderNameSchema,
  bankName: z.string().trim().min(2).max(80),
  bankAccountHolderName: holderNameSchema,
  bankAccountNumber: bankAccountNumberSchema,
  bankInterbankAccountNumber: bankInterbankAccountNumberSchema,
});

/** Public allowlist DTO — same shape; kept separate for boundary clarity. */
export const publicBusinessSettingsSchema = businessSettingsSchema;

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
export type PublicBusinessSettings = z.infer<
  typeof publicBusinessSettingsSchema
>;

export function formatWhatsappDisplay(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("51") && digits.length === 11) {
    const local = digits.slice(2);
    return `+51 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return `+${digits}`;
}

export function formatYapePhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return digits;
}

export function buildWhatsappHref(e164: string): string {
  return `https://wa.me/${e164.replace(/\D/g, "")}`;
}

export function buildEmailHref(email: string): string {
  return `mailto:${email.trim()}`;
}
