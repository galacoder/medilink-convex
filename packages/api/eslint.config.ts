import { defineConfig } from "eslint/config";

import { baseConfig } from "@medilink/eslint-config/base";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
);
