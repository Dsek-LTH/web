import { iconsPlugin, getIconCollections } from "@egoist/tailwindcss-icons";
import { colors } from "./src/lib/utils/themes";
import typographyPlugin from "@tailwindcss/typography";
import tailwindEasing from "@whiterussianstudio/tailwind-easing";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'], // dark mode set by class="dark" or data-theme="dark" in DOM
  mode: "jit",
  content: ["./src/**/*.{html,js,json,svelte,ts}"],
  safelist: [
    "alert-error",
    "alert-success",
    "alert-warning",
    "alert-info",
    "alert-primary",
  ],
  // 👆 this forces tailwind to include these classes, used for dynamically setting toast colors
  theme: {
    extend: {
      gridTemplateColumns: {
        "1-2": "1fr 2fr",
      },
    },
  },
};
