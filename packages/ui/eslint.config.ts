import { defineConfig } from "eslint/config";

import { baseConfig } from "@medilink/eslint-config/base";
import { reactConfig } from "@medilink/eslint-config/react";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
  reactConfig,
);
