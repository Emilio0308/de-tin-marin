import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@de-tin-marin/ui",
    "@de-tin-marin/shared",
    "@de-tin-marin/config",
    "@de-tin-marin/db",
    "@de-tin-marin/validations",
  ],
};

export default withNextIntl(nextConfig);
