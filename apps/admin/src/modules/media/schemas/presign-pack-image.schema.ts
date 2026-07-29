import { z } from "zod";
import {
  CATALOG_IMAGE_CONTENT_TYPES,
  CATALOG_IMAGE_MAX_BYTES,
} from "@/modules/media/schemas/presign-catalog-image.schema";

export {
  CATALOG_IMAGE_CONTENT_TYPES as PACK_IMAGE_CONTENT_TYPES,
  CATALOG_IMAGE_MAX_BYTES as PACK_IMAGE_MAX_BYTES,
  type CatalogImageContentType as PackImageContentType,
} from "@/modules/media/schemas/presign-catalog-image.schema";

/** @deprecated Use createCatalogImageUploadUrlInputSchema with folder */
export const createPackImageUploadUrlInputSchema = z.object({
  contentType: z.enum(CATALOG_IMAGE_CONTENT_TYPES),
  contentLength: z.number().int().positive().max(CATALOG_IMAGE_MAX_BYTES),
  fileName: z.string().trim().min(1).max(255).optional(),
});
