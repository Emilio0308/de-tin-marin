#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { MediaStack } from "../lib/media-stack";

const app = new cdk.App();

const awsEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
};

new MediaStack(app, "MediaStaging", {
  env: awsEnv,
  environmentName: "staging",
  corsAllowedOrigins: [
    "http://localhost:3001",
    // Add hosted admin staging origin when available, e.g.:
    // "https://admin-staging.example.com",
  ],
  description: "Media CDN (S3 + CloudFront) — staging",
});

new MediaStack(app, "MediaProduction", {
  env: awsEnv,
  environmentName: "production",
  corsAllowedOrigins: [
    // Set the real admin production origin before browser uploads from prod.
    // "https://admin.example.com",
  ],
  description: "Media CDN (S3 + CloudFront) — production",
});
