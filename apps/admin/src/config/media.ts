import "server-only";

import { env } from "@/config/env";

export const mediaConfig = {
  region: env.AWS_REGION,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  bucket: env.MEDIA_S3_BUCKET,
  cdnBaseUrl: env.NEXT_PUBLIC_MEDIA_CDN_BASE_URL.replace(/\/$/, ""),
};
