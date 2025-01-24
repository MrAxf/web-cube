// @ts-check
import { spawn } from "node:child_process";
import { dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
  integrations: [
    expressiveCode({
      themes: ["dracula"],
    }),
    mdx(),
    {
      name: "pagefind",
      hooks: {
        "astro:build:done": ({ dir }) => {
          const targetDir = fileURLToPath(dir);
          const cwd = dirname(fileURLToPath(import.meta.url));
          const relativeDir = relative(cwd, targetDir);
          return new Promise((resolve) => {
            spawn("npx", ["-y", "pagefind", "--site", relativeDir], {
              stdio: "inherit",
              shell: true,
              cwd,
            }).on("close", () => resolve());
          });
        },
      },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
