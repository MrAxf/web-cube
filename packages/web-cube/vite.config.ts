import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    build: {
        lib: {
            entry: {
                index: "./src/index.ts",
                utils: "./src/utils.ts",
                "web-rubik": "./src/web-rubik.ts",
            },
            name: "WebCube",
            formats: ["es"],
        },
    },
    plugins: [dts()],
});
