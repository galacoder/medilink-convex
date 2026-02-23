import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for the web app component tests.
 *
 * WHY: Uses jsdom environment for React component testing with
 * @testing-library/react. The ~ alias matches the Next.js tsconfig
 * paths so imports like "~/lib/i18n/..." resolve correctly in tests.
 *
 * The "convex/_generated/api" alias points to a stub file so tests
 * can run without a live Convex deployment. The actual Convex functions
 * are mocked via vi.mock("convex/react") in individual test files.
 */
export default defineConfig({
  plugins: [react()],
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
      // Map @medilink/db/api to stub for tests
      // (actual _generated dir is gitignored and created by npx convex dev)
      "@medilink/db/api": path.resolve(
        __dirname,
        "./src/__mocks__/convex-api.ts",
      ),
    },
  },
});
