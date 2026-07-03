import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const ecommerceSrc = fileURLToPath(
  new URL("./apps/ecommerce/src", import.meta.url),
);
const adminSrc = fileURLToPath(new URL("./apps/admin/src", import.meta.url));

const jsxAutomatic = { jsx: "automatic" as const };

export default defineConfig({
  test: {
    projects: [
      {
        esbuild: jsxAutomatic,
        test: {
          name: "packages",
          environment: "node",
          include: ["packages/**/src/**/*.test.{ts,tsx}"],
        },
      },
      {
        esbuild: jsxAutomatic,
        resolve: { alias: { "@": ecommerceSrc } },
        test: {
          name: "ecommerce",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: ["apps/ecommerce/src/**/*.test.{ts,tsx}"],
        },
      },
      {
        esbuild: jsxAutomatic,
        resolve: { alias: { "@": adminSrc } },
        test: {
          name: "admin",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: ["apps/admin/src/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
