import "server-only";

import {
  publicBusinessSettingsSchema,
  type PublicBusinessSettings,
} from "@de-tin-marin/validations/business-settings";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { getPublicBusinessSettingsRepo } from "../repositories/business-settings.repository";

export async function getPublicBusinessSettingsService(
  config: SupabaseConfig,
): Promise<
  | { ok: true; data: PublicBusinessSettings }
  | { ok: false; error: "NOT_FOUND" | "UNEXPECTED" }
> {
  try {
    const row = await getPublicBusinessSettingsRepo(config);
    if (!row) {
      return { ok: false, error: "NOT_FOUND" };
    }

    const parsed = publicBusinessSettingsSchema.safeParse({
      whatsappE164: row.whatsapp_e164,
      email: row.email,
      yapePhone: row.yape_phone,
      yapeHolderName: row.yape_holder_name,
      bankName: row.bank_name,
      bankAccountHolderName: row.bank_account_holder_name,
      bankAccountNumber: row.bank_account_number,
      bankInterbankAccountNumber: row.bank_interbank_account_number,
    });

    if (!parsed.success) {
      return { ok: false, error: "UNEXPECTED" };
    }

    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, error: "UNEXPECTED" };
  }
}
