import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@medilink/eslint-config/base";
import { nextjsConfig } from "@medilink/eslint-config/nextjs";
import { reactConfig } from "@medilink/eslint-config/react";

export default defineConfig(
  {
    ignores: [
      ".next/**",
      "convex/**", // Auto-generated Convex stubs
      "audit-routes.js", // Development maintenance script (CommonJS)
    ],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
  // E2E and security test files use Playwright APIs which return `any`-typed values.
  // Strict TypeScript rules do not apply to test infrastructure files.
  {
    files: ["e2e/**/*.ts", "e2e/**/*.tsx", "tests/**/*.ts", "tests/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
);
