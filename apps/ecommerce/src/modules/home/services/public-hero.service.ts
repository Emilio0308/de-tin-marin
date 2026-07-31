import "server-only";

import {
  publicHeroConfigSchema,
  type PublicHeroConfig,
} from "@de-tin-marin/validations/hero";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  getPublicHeroSettingsRepo,
  listPublicHeroImagesRepo,
} from "../repositories/hero.repository";

function isWithinRange(now: Date, startsAt: string, endsAt: string): boolean {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return now >= start && now <= end;
}

export async function getPublicHeroConfigService(
  config: SupabaseConfig,
  now: Date = new Date(),
): Promise<
  { ok: true; data: PublicHeroConfig } | { ok: false; error: "UNEXPECTED" }
> {
  try {
    const [settings, images] = await Promise.all([
      getPublicHeroSettingsRepo(config),
      listPublicHeroImagesRepo(config),
    ]);

    const displayMode =
      settings?.display_mode === "carousel" ? "carousel" : "static";

    const activeSlides = images
      .filter((row) => isWithinRange(now, row.starts_at, row.ends_at))
      .map((row) => ({
        imageUrl: row.image_url,
        altText: row.alt_text,
        sortOrder: row.sort_order,
      }));

    const slides =
      displayMode === "static" ? activeSlides.slice(0, 1) : activeSlides;

    const parsed = publicHeroConfigSchema.safeParse({
      displayMode,
      slides,
    });

    if (!parsed.success) {
      return { ok: false, error: "UNEXPECTED" };
    }

    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, error: "UNEXPECTED" };
  }
}
