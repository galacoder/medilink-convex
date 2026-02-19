import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for the web app component tests.
 *
 * WHY: Uses jsdom environment for React component testing with
 * @testing-library/react. The ~ alias matches the Next.js tsconfig
 * paths so imports like "~/lib/i18n/..." resolve correctly in tests.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
