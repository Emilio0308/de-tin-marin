import "server-only";

import {
  heroImageInputSchema,
  heroSettingsSchema,
  reorderHeroImagesSchema,
} from "@de-tin-marin/validations/hero";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  createHeroImageRepo,
  getHeroSettingsRepo,
  listHeroImagesRepo,
  reorderHeroImagesRepo,
  softDeleteHeroImageRepo,
  updateHeroImageRepo,
  updateHeroSettingsRepo,
} from "../repositories/hero.repository";
import type { HeroImageDTO, HeroSettingsDTO } from "../types/hero.dto";

function toSettingsDTO(
  row: NonNullable<Awaited<ReturnType<typeof getHeroSettingsRepo>>>,
): HeroSettingsDTO {
  return {
    displayMode: row.display_mode === "carousel" ? "carousel" : "static",
  };
}

function toImageDTO(
  row: Awaited<ReturnType<typeof listHeroImagesRepo>>[number],
): HeroImageDTO {
  return {
    id: row.id,
    imageUrl: row.image_url,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

export async function getHeroSettingsService(
  config: SupabaseConfig,
): Promise<HeroSettingsDTO | null> {
  const row = await getHeroSettingsRepo(config);
  if (!row) return null;
  return toSettingsDTO(row);
}

export async function updateHeroSettingsService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = heroSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  await updateHeroSettingsRepo(config, {
    display_mode: parsed.data.displayMode,
  });

  return { ok: true as const };
}

export async function listHeroImagesService(
  config: SupabaseConfig,
): Promise<HeroImageDTO[]> {
  const rows = await listHeroImagesRepo(config);
  return rows.map(toImageDTO);
}

export async function createHeroImageService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = heroImageInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  const data = parsed.data;
  const row = await createHeroImageRepo(config, {
    image_url: data.imageUrl,
    alt_text: data.altText?.trim() || null,
    sort_order: data.sortOrder,
    starts_at: data.startsAt,
    ends_at: data.endsAt,
  });

  return { ok: true as const, id: row.id };
}

export async function updateHeroImageService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = heroImageInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  const { id, imageUrl, altText, sortOrder, startsAt, endsAt } = parsed.data;
  if (!id) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: { formErrors: ["id required"], fieldErrors: {} },
    };
  }

  await updateHeroImageRepo(config, id, {
    image_url: imageUrl,
    alt_text: altText?.trim() || null,
    sort_order: sortOrder,
    starts_at: startsAt,
    ends_at: endsAt,
  });

  return { ok: true as const };
}

export async function deleteHeroImageService(
  config: SupabaseConfig,
  id: string,
) {
  await softDeleteHeroImageRepo(config, id);
  return { ok: true as const };
}

export async function reorderHeroImagesService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = reorderHeroImagesSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  await reorderHeroImagesRepo(config, parsed.data.orderedIds);
  return { ok: true as const };
}
