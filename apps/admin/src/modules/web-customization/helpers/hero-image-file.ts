import {
  CATALOG_IMAGE_CONTENT_TYPES,
  CATALOG_IMAGE_MAX_BYTES,
} from "@/modules/media/schemas/presign-catalog-image.schema";
import {
  isSquareHeroAspect,
  meetsHeroImageMinSide,
} from "@de-tin-marin/validations/hero";

export type HeroImageValidationError =
  "INVALID_TYPE" | "INVALID_SIZE" | "INVALID_DIMENSIONS" | "TOO_SMALL";

export type HeroImageValidationResult =
  { ok: true } | { ok: false; error: HeroImageValidationError };

function isAllowedMime(file: File): boolean {
  return (CATALOG_IMAGE_CONTENT_TYPES as readonly string[]).includes(file.type);
}

function isAllowedSize(file: File): boolean {
  return file.size > 0 && file.size <= CATALOG_IMAGE_MAX_BYTES;
}

/** Sync checks (MIME + bytes) before loading pixels. */
export function isAllowedHeroImageFile(file: File): boolean {
  return isAllowedMime(file) && isAllowedSize(file);
}

/**
 * Hero uploads must be roughly square (1:1) and large enough for the frame.
 * Exact pixel dimensions are not required.
 */
export async function validateHeroImageFile(
  file: File,
): Promise<HeroImageValidationResult> {
  if (!isAllowedMime(file)) {
    return { ok: false, error: "INVALID_TYPE" };
  }
  if (!isAllowedSize(file)) {
    return { ok: false, error: "INVALID_SIZE" };
  }

  try {
    const { width, height } = await readImageDimensions(file);

    if (!meetsHeroImageMinSide(width, height)) {
      return { ok: false, error: "TOO_SMALL" };
    }
    if (!isSquareHeroAspect(width, height)) {
      return { ok: false, error: "INVALID_DIMENSIONS" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "INVALID_DIMENSIONS" };
  }
}

async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }
  return loadImageDimensions(file);
}

function loadImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("IMAGE_LOAD_FAILED"));
    };
    img.src = url;
  });
}
