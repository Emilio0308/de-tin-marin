"use server";

import { createCatalogImageUploadUrlAction } from "@/modules/media/actions/create-catalog-image-upload-url";

/**
 * Presign for pack images (`packs/` prefix). Prefer
 * `createCatalogImageUploadUrlAction` with `{ folder: "packs", … }` for new code.
 */
export async function createPackImageUploadUrlAction(raw: unknown) {
  const input =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return createCatalogImageUploadUrlAction({ ...input, folder: "packs" });
}
