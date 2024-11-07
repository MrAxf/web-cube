import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    build: {
        lib: {
            entry: {
                index: "./src/index.ts",
            },
            name: "WebCube",
            formats: ["es"],
        },
    },
    plugins: [dts()],
    // Agregar configuración de servidor
    server: {
        open: "/playground/index.html",
    },
});
