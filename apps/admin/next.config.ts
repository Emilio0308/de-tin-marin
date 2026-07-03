import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@de-tin-marin/ui",
    "@de-tin-marin/shared",
    "@de-tin-marin/config",
    "@de-tin-marin/db",
    "@de-tin-marin/validations",
  ],
};

export default nextConfig;
