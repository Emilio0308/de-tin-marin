import "server-only";

import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mediaConfig } from "@/config/media";
import {
  createCatalogImageUploadUrlInputSchema,
  type CatalogImageContentType,
} from "@/modules/media/schemas/presign-catalog-image.schema";
import { logServerError } from "@/shared/errors/server-error";

const PRESIGN_EXPIRES_IN_SECONDS = 300;

function extensionForContentType(contentType: CatalogImageContentType): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

function createS3Client(): S3Client {
  return new S3Client({
    region: mediaConfig.region,
    credentials: {
      accessKeyId: mediaConfig.accessKeyId,
      secretAccessKey: mediaConfig.secretAccessKey,
    },
  });
}

export type PresignCatalogImageSuccess = {
  ok: true;
  data: {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresIn: number;
  };
};

export type PresignCatalogImageFailure = {
  ok: false;
  error: "VALIDATION";
};

export async function createCatalogImageUploadUrlService(
  raw: unknown,
): Promise<PresignCatalogImageSuccess | PresignCatalogImageFailure> {
  const parsed = createCatalogImageUploadUrlInputSchema.safeParse(raw);
  if (!parsed.success) {
    logServerError(
      "createCatalogImageUploadUrlService.validation",
      parsed.error.flatten(),
    );
    return { ok: false, error: "VALIDATION" };
  }

  const { folder, contentType } = parsed.data;
  const key = `${folder}/${randomUUID()}.${extensionForContentType(contentType)}`;

  const command = new PutObjectCommand({
    Bucket: mediaConfig.bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(createS3Client(), command, {
    expiresIn: PRESIGN_EXPIRES_IN_SECONDS,
  });

  console.info(
    `[createCatalogImageUploadUrlService] presigned folder=${folder} key=${key} bucket=${mediaConfig.bucket}`,
  );

  return {
    ok: true,
    data: {
      uploadUrl,
      publicUrl: `${mediaConfig.cdnBaseUrl}/${key}`,
      key,
      expiresIn: PRESIGN_EXPIRES_IN_SECONDS,
    },
  };
}
