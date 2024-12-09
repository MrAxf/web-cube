import { getIconCollections, iconsPlugin } from "@egoist/tailwindcss-icons";
import typography from "@tailwindcss/typography";
import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        opensans: ["Open Sans", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        "cube-bg": "var(--color-cube-bg)",
        "cube-up": "var(--color-cube-up)",
        "cube-down": "var(--color-cube-down)",
        "cube-front": "var(--color-cube-front)",
        "cube-back": "var(--color-cube-back)",
        "cube-left": "var(--color-cube-left)",
        "cube-right": "var(--color-cube-right)",
      },
    },
  },
  plugins: [
    typography,
    iconsPlugin({
      icons: getIconCollections(["heroicons", "simple-icons"]),
    }),
  ],
};
