import { getErrorMessage, logClientError } from "@/shared/errors/client-error";

export type PutPresignedCatalogImageResult =
  { ok: true } | { ok: false; message: string; status?: number };

/**
 * Browser PUT to an S3 presigned URL. Failures (CORS, network, 4xx/5xx) are
 * logged in the browser console — they never reach Vercel Runtime Logs.
 */
export async function putPresignedCatalogImage(
  uploadUrl: string,
  file: File,
): Promise<PutPresignedCatalogImageResult> {
  try {
    const putResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!putResponse.ok) {
      const message = `S3 PUT failed: ${putResponse.status} ${putResponse.statusText}`;
      logClientError("putPresignedCatalogImage", message);
      return { ok: false, message, status: putResponse.status };
    }

    return { ok: true };
  } catch (error) {
    logClientError("putPresignedCatalogImage", error);
    return {
      ok: false,
      message: getErrorMessage(error),
    };
  }
}
