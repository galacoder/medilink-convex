import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mocksDir = resolve(__dirname, "../../convex-test-mocks");

export default defineConfig({
  resolve: {
    alias: [
      /**
       * Mock better-auth packages for convex-test integration tests.
       *
       * WHY: convex/auth.ts imports better-auth and @convex-dev/better-auth
       * which are runtime dependencies that aren't available in the vitest
       * Node environment used by convex-test. These stubs provide no-op
       * implementations that let the module load while convex-test's
       * t.withIdentity() handles authentication directly.
       *
       * Absolute paths required by vitest (relative aliases not supported).
       *
       * vi: "Giả lập better-auth cho kiểm tra" / en: "better-auth stubs for tests"
       */
      {
        find: /^better-auth\/minimal$/,
        replacement: resolve(mocksDir, "better-auth-minimal.ts"),
      },
      {
        find: /^better-auth\/plugins$/,
        replacement: resolve(mocksDir, "better-auth-plugins.ts"),
      },
      {
        find: /^@convex-dev\/better-auth\/plugins$/,
        replacement: resolve(mocksDir, "convex-dev-better-auth-plugins.ts"),
      },
      {
        find: /^@convex-dev\/better-auth$/,
        replacement: resolve(mocksDir, "convex-dev-better-auth.ts"),
      },
    ],
  },
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
  },
});
