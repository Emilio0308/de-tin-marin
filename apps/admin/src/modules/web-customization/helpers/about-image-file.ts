import {
  CATALOG_IMAGE_CONTENT_TYPES,
  CATALOG_IMAGE_MAX_BYTES,
} from "@/modules/media/schemas/presign-catalog-image.schema";
import {
  isAboutLandscapeAspect,
  meetsAboutImageMinWidth,
} from "@de-tin-marin/validations/about-page";

export type AboutImageValidationError =
  "INVALID_TYPE" | "INVALID_SIZE" | "INVALID_DIMENSIONS" | "TOO_SMALL";

export type AboutImageValidationResult =
  { ok: true } | { ok: false; error: AboutImageValidationError };

function isAllowedMime(file: File): boolean {
  return (CATALOG_IMAGE_CONTENT_TYPES as readonly string[]).includes(file.type);
}

function isAllowedSize(file: File): boolean {
  return file.size > 0 && file.size <= CATALOG_IMAGE_MAX_BYTES;
}

export function isAllowedAboutImageFile(file: File): boolean {
  return isAllowedMime(file) && isAllowedSize(file);
}

/**
 * About story uploads must be landscape ~16:9 and wide enough for the frame.
 */
export async function validateAboutImageFile(
  file: File,
): Promise<AboutImageValidationResult> {
  if (!isAllowedMime(file)) {
    return { ok: false, error: "INVALID_TYPE" };
  }
  if (!isAllowedSize(file)) {
    return { ok: false, error: "INVALID_SIZE" };
  }

  try {
    const { width, height } = await readImageDimensions(file);

    if (!meetsAboutImageMinWidth(width)) {
      return { ok: false, error: "TOO_SMALL" };
    }
    if (!isAboutLandscapeAspect(width, height)) {
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
