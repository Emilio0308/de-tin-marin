import "server-only";

import { aboutPageSettingsSchema } from "@de-tin-marin/validations/about-page";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  getAboutPageSettingsRepo,
  updateAboutPageSettingsRepo,
} from "../repositories/about-page.repository";
import type { AboutPageSettingsDTO } from "../types/about-page.dto";

export async function getAboutPageSettingsService(
  config: SupabaseConfig,
): Promise<AboutPageSettingsDTO | null> {
  const row = await getAboutPageSettingsRepo(config);
  if (!row) return null;
  return { imageUrl: row.image_url };
}

export async function updateAboutPageSettingsService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = aboutPageSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  await updateAboutPageSettingsRepo(config, {
    image_url: parsed.data.imageUrl,
  });

  return { ok: true as const };
}
