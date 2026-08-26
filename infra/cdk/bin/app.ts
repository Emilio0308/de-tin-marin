#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { MediaStack } from "../lib/media-stack";

const app = new cdk.App();

const awsEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
};

/** Comma-separated HTTPS origins of the admin app (Vercel). Required for browser PUT. */
function corsOriginsFromEnv(fallback: string[]): string[] {
  const fromEnv =
    process.env.ADMIN_CORS_ORIGINS?.split(",")
      .map((origin) => origin.trim().replace(/\/$/, ""))
      .filter(Boolean) ?? [];
  return [...new Set([...fallback, ...fromEnv])];
}

new MediaStack(app, "MediaStaging", {
  env: awsEnv,
  environmentName: "staging",
  corsAllowedOrigins: corsOriginsFromEnv([
    "http://localhost:3001",
    // "https://de-tin-marin-admin-git-develop-emilio0308s-projects.vercel.app",
    // Preview / staging admin host — set ADMIN_CORS_ORIGINS when deploying, e.g.:
    // ADMIN_CORS_ORIGINS=https://admin-xxx.vercel.app pnpm infra:deploy:staging
  ]),
  description: "Media CDN (S3 + CloudFront) — staging",
});

new MediaStack(app, "MediaProduction", {
  env: awsEnv,
  environmentName: "production",
  corsAllowedOrigins: corsOriginsFromEnv([
    // Must include the real admin production origin or browser uploads fail (CORS).
    // ADMIN_CORS_ORIGINS=https://admin.example.com pnpm infra:deploy:production
  ]),
  description: "Media CDN (S3 + CloudFront) — production",
});
