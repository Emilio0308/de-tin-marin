import { z } from "zod";

/** Max size per catalog image (10 MiB). */
export const CATALOG_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const CATALOG_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type CatalogImageContentType =
  (typeof CATALOG_IMAGE_CONTENT_TYPES)[number];

/** S3 key prefix per catalog entity (one folder per group). */
export const CATALOG_IMAGE_FOLDERS = [
  "packs",
  "products",
  "bundles",
  "containers",
] as const;

export type CatalogImageFolder = (typeof CATALOG_IMAGE_FOLDERS)[number];

export const createCatalogImageUploadUrlInputSchema = z.object({
  folder: z.enum(CATALOG_IMAGE_FOLDERS),
  contentType: z.enum(CATALOG_IMAGE_CONTENT_TYPES),
  contentLength: z.number().int().positive().max(CATALOG_IMAGE_MAX_BYTES),
  fileName: z.string().trim().min(1).max(255).optional(),
});

export type CreateCatalogImageUploadUrlInput = z.infer<
  typeof createCatalogImageUploadUrlInputSchema
>;

/** @deprecated Use CATALOG_IMAGE_MAX_BYTES */
export const PACK_IMAGE_MAX_BYTES = CATALOG_IMAGE_MAX_BYTES;
/** @deprecated Use CATALOG_IMAGE_CONTENT_TYPES */
export const PACK_IMAGE_CONTENT_TYPES = CATALOG_IMAGE_CONTENT_TYPES;
