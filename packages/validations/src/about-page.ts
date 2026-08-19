import { z } from "zod";

/** Matches ecommerce `/nosotros` story frame `aspect-[1.79]` (~16:9). */
export const ABOUT_IMAGE_ASPECT = 16 / 9;
/** Relative tolerance on aspect ratio (±5 %). */
export const ABOUT_IMAGE_ASPECT_TOLERANCE = 0.05;
export const ABOUT_IMAGE_MIN_WIDTH = 800;

export function isAboutLandscapeAspect(
  width: number,
  height: number,
  tolerance = ABOUT_IMAGE_ASPECT_TOLERANCE,
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
  return Math.abs(ratio - ABOUT_IMAGE_ASPECT) / ABOUT_IMAGE_ASPECT <= tolerance;
}

export function meetsAboutImageMinWidth(
  width: number,
  minWidth = ABOUT_IMAGE_MIN_WIDTH,
): boolean {
  return Number.isFinite(width) && width >= minWidth;
}

export const aboutPageSettingsSchema = z.object({
  imageUrl: z.string().url().nullable(),
});

export const publicAboutPageImageSchema = z.object({
  imageUrl: z.string().url().nullable(),
});

export type AboutPageSettingsInput = z.infer<typeof aboutPageSettingsSchema>;
export type PublicAboutPageImage = z.infer<typeof publicAboutPageImageSchema>;
