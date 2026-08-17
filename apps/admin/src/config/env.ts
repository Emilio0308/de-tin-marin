import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    AWS_REGION: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    MEDIA_S3_BUCKET: z.string().min(1),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().max(65535).optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    SMTP_FROM: z.string().min(1).optional(),
    SMTP_REPLY_TO: z.string().email().optional(),
    ORDER_NOTIFY_EXTRA_EMAILS: z.string().optional(),
    ORDER_ECOMMERCE_APP_BASE_URL: z.string().url().optional(),
    ORDER_ADMIN_APP_BASE_URL: z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_NAME: z.literal("admin"),
    NEXT_PUBLIC_MEDIA_CDN_BASE_URL: z.string().url(),
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    MEDIA_S3_BUCKET: process.env.MEDIA_S3_BUCKET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    SMTP_REPLY_TO: process.env.SMTP_REPLY_TO,
    ORDER_NOTIFY_EXTRA_EMAILS: process.env.ORDER_NOTIFY_EXTRA_EMAILS,
    ORDER_ECOMMERCE_APP_BASE_URL: process.env.ORDER_ECOMMERCE_APP_BASE_URL,
    ORDER_ADMIN_APP_BASE_URL: process.env.ORDER_ADMIN_APP_BASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "admin",
    NEXT_PUBLIC_MEDIA_CDN_BASE_URL: process.env.NEXT_PUBLIC_MEDIA_CDN_BASE_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

export const supabaseConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};
