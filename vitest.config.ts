import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "~": projectRoot,
      "~~": projectRoot,
    },
  },
  test: {
    environment: "node",
    clearMocks: true,
  },
});
