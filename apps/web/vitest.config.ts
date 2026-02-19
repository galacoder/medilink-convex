import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      // Resolve Convex generated types from project root
      "convex/_generated": path.resolve(__dirname, "../../convex/_generated"),
    },
  },
});
