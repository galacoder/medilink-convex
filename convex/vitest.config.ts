import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for Convex backend integration tests.
 *
 * WHY: Uses edge-runtime environment for Convex compatibility.
 * Resolves better-auth and @convex-dev/better-auth to stub mocks
 * so convex-test can load modules without the full auth packages.
 */
export default defineConfig({
  test: {
    environment: "edge-runtime",
    globals: true,
    include: ["**/*.test.ts"],
  },
  resolve: {
    alias: {
      "better-auth/minimal": path.resolve(
        __dirname,
        "../convex-test-mocks/better-auth-minimal.ts",
      ),
      "better-auth/plugins": path.resolve(
        __dirname,
        "../convex-test-mocks/better-auth-plugins.ts",
      ),
      "@convex-dev/better-auth/plugins": path.resolve(
        __dirname,
        "../convex-test-mocks/convex-dev-better-auth-plugins.ts",
      ),
      "@convex-dev/better-auth": path.resolve(
        __dirname,
        "../convex-test-mocks/convex-dev-better-auth.ts",
      ),
    },
  },
});
