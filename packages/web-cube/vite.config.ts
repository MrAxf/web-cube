import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    build: {
        lib: {
            entry: {
                index: "./src/index.ts",
                utils: "./src/utils.ts",
                "web-cube": "./src/web-cube.ts",
            },
            name: "WebCube",
            formats: ["es"],
        },
    },
    plugins: [dts()],
});
