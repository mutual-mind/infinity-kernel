import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@infinity/kernel": path.resolve(__dirname, "packages/kernel/src/index.ts"),
      "@infinity/storage-files": path.resolve(__dirname, "packages/storage-files/src/index.ts"),
      "@infinity/projection-sqlite": path.resolve(__dirname, "packages/projection-sqlite/src/index.ts"),
    },
  },
});
