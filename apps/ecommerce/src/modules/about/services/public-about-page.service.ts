import "server-only";

import {
  publicAboutPageImageSchema,
  type PublicAboutPageImage,
} from "@de-tin-marin/validations/about-page";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { getPublicAboutPageSettingsRepo } from "../repositories/about-page.repository";

export async function getPublicAboutPageImageService(
  config: SupabaseConfig,
): Promise<
  { ok: true; data: PublicAboutPageImage } | { ok: false; error: "UNEXPECTED" }
> {
  try {
    const row = await getPublicAboutPageSettingsRepo(config);
    const parsed = publicAboutPageImageSchema.safeParse({
      imageUrl: row?.image_url ?? null,
    });

    if (!parsed.success) {
      return { ok: false, error: "UNEXPECTED" };
    }

    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, error: "UNEXPECTED" };
  }
}
