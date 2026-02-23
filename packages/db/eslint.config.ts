import { defineConfig } from "eslint/config";

import { baseConfig } from "@medilink/eslint-config/base";

export default defineConfig(
  {
    // convex/** has its own tsconfig and linting requirements;
    // it is linted separately via packages/db/convex/tsconfig.json
    ignores: ["dist/**", "convex/**"],
  },
  baseConfig,
);
