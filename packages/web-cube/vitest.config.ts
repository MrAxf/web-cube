import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["bench/**/*.bench.ts"],
    benchmark: {
      include: ["bench/**/*.bench.ts"],
    },
  },
});
