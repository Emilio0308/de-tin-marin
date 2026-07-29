import "server-only";

import { createCatalogImageUploadUrlService } from "@/modules/media/services/presign-catalog-image.service";

/** @deprecated Use createCatalogImageUploadUrlService with folder: "packs" */
export async function createPackImageUploadUrlService(raw: unknown) {
  const input =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return createCatalogImageUploadUrlService({ ...input, folder: "packs" });
}

export type {
  PresignCatalogImageFailure as PresignPackImageFailure,
  PresignCatalogImageSuccess as PresignPackImageSuccess,
} from "@/modules/media/services/presign-catalog-image.service";
