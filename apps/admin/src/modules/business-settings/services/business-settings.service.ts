import "server-only";

import { businessSettingsSchema } from "@de-tin-marin/validations/business-settings";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  getBusinessSettingsRepo,
  updateBusinessSettingsRepo,
} from "../repositories/business-settings.repository";
import type { BusinessSettingsDTO } from "../types/business-settings.dto";

function toDTO(
  row: NonNullable<Awaited<ReturnType<typeof getBusinessSettingsRepo>>>,
): BusinessSettingsDTO {
  return {
    whatsappE164: row.whatsapp_e164,
    email: row.email,
    yapePhone: row.yape_phone,
    yapeHolderName: row.yape_holder_name,
    bankName: row.bank_name,
    bankAccountHolderName: row.bank_account_holder_name,
    bankAccountNumber: row.bank_account_number,
    bankInterbankAccountNumber: row.bank_interbank_account_number,
  };
}

export async function getBusinessSettingsService(
  config: SupabaseConfig,
): Promise<BusinessSettingsDTO | null> {
  const row = await getBusinessSettingsRepo(config);
  if (!row) return null;
  return toDTO(row);
}

export async function updateBusinessSettingsService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = businessSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  const data = parsed.data;
  await updateBusinessSettingsRepo(config, {
    whatsapp_e164: data.whatsappE164,
    email: data.email,
    yape_phone: data.yapePhone,
    yape_holder_name: data.yapeHolderName,
    bank_name: data.bankName,
    bank_account_holder_name: data.bankAccountHolderName,
    bank_account_number: data.bankAccountNumber,
    bank_interbank_account_number: data.bankInterbankAccountNumber,
  });

  return { ok: true as const };
}
