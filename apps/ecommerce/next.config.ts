import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@de-tin-marin/ui",
    "@de-tin-marin/shared",
    "@de-tin-marin/config",
    "@de-tin-marin/db",
    "@de-tin-marin/validations",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
