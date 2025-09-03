import { iconsPlugin, getIconCollections } from "@egoist/tailwindcss-icons";
import { colors } from "./src/lib/utils/themes";
import typographyPlugin from "@tailwindcss/typography";
import daisyuiPlugin from "daisyui";
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
      fontFamily: {
        "nolla-sans": ["Inter", "ui-sans-serif", "sans-serif"],
        "nolla-mono": ['"IBM Plex Mono"', "ui-monospace", "monospace"],
        "nolla-post-reveal": ["Lexend", "ui-sans-serif", "sans-serif"],
        "nolla-stab": ["Mason Sans", "ui-serif", "serif"],
        "nolla-pepp": ["Genty", "ui-sans-serif", "sans-serif"],
      },
      keyframes: {
        "reverse-spin": {
          from: {
            transform: "rotate(360deg)",
          },
        },
        "scale-fade": {
          "0%": {
            transform: "scale(1)",
            opacity: "0.6",
          },
          "50%": {
            transform: "scale(1.1)",
            opacity: "1",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "0.6",
          },
        },
      },
      animation: {
        "scale-fade": "scale-fade 2s ease-in-out infinite",
        "reverse-spin": "reverse-spin 1s linear infinite",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".text-stroke": {
          "-webkit-text-stroke-width": "1px",
          "-webkit-text-stroke-color": "black",
        },
        ".text-stroke-white": {
          "-webkit-text-stroke-color": "white",
        },
        ".text-stroke-gray": {
          "-webkit-text-stroke-color": "#4E4A45",
        },
        ".text-stroke-2": {
          "-webkit-text-stroke-width": "2px",
        },
        ".text-stroke-0": {
          "-webkit-text-stroke-width": "0px",
        },
        ".text-stroke-4": {
          "-webkit-text-stroke-width": "4px",
        },
        ".text-stroke-8": {
          "-webkit-text-stroke-width": "8px",
        },
      });
    },
  ],
};
