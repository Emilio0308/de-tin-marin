import { z } from "zod";

/**
 * Hero images must be square (1:1) to match ecommerce `aspect-square`.
 * Exact pixel size is not required — only the aspect ratio (with tolerance).
 */
export const HERO_IMAGE_ASPECT_TOLERANCE = 0.02;
/** Reject tiny uploads that look bad when scaled up in the hero frame. */
export const HERO_IMAGE_MIN_SIDE_PX = 600;

/** @deprecated Use aspect-ratio checks; kept for docs/migration notes. */
export const HERO_IMAGE_WIDTH = 1200;
/** @deprecated Use aspect-ratio checks; kept for docs/migration notes. */
export const HERO_IMAGE_HEIGHT = 1200;

export function isSquareHeroAspect(
  width: number,
  height: number,
  tolerance = HERO_IMAGE_ASPECT_TOLERANCE,
): boolean {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return false;
  }
  const ratio = width / height;
  return Math.abs(ratio - 1) <= tolerance;
}

export function meetsHeroImageMinSide(
  width: number,
  height: number,
  minSide = HERO_IMAGE_MIN_SIDE_PX,
): boolean {
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width >= minSide &&
    height >= minSide
  );
}

export const heroDisplayModeSchema = z.enum(["static", "carousel"]);

export const heroSettingsSchema = z.object({
  displayMode: heroDisplayModeSchema,
});

export const heroImageInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    imageUrl: z.string().url().min(1),
    altText: z.string().trim().max(200).nullable().optional(),
    sortOrder: z.number().int().nonnegative().default(0),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  });

export const reorderHeroImagesSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

export const publicHeroSlideSchema = z.object({
  imageUrl: z.string().url(),
  altText: z.string().nullable(),
  sortOrder: z.number().int(),
});

export const publicHeroConfigSchema = z.object({
  displayMode: heroDisplayModeSchema,
  slides: z.array(publicHeroSlideSchema),
});

export type HeroDisplayMode = z.infer<typeof heroDisplayModeSchema>;
export type HeroSettingsInput = z.infer<typeof heroSettingsSchema>;
export type HeroImageInput = z.infer<typeof heroImageInputSchema>;
export type ReorderHeroImagesInput = z.infer<typeof reorderHeroImagesSchema>;
export type PublicHeroSlide = z.infer<typeof publicHeroSlideSchema>;
export type PublicHeroConfig = z.infer<typeof publicHeroConfigSchema>;
