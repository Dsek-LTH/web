import { iconsPlugin, getIconCollections } from "@egoist/tailwindcss-icons";
import { colors } from "./src/lib/utils/themes";

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
      },
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          ...colors.light,
        },
      },
      {
        dark: {
          ...colors.dark,
        },
      },
      {
        nollningPreReveal: {
          primary: "#ffb4e5",
          secondary: "#e2c6ff",
          accent: "#1dcdbc",
          neutral: "#bbb6b6",
          "base-100": "#efefef",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",

          // "--rounded-box": "1rem", // border radius rounded-box utility class, used in card and other large boxes
          // "--rounded-btn": "0.5rem", // border radius rounded-btn utility class, used in buttons and similar element
          // "--rounded-badge": "1.9rem", // border radius rounded-badge utility class, used in badges and similar
          // "--animation-btn": "0.25s", // duration of animation when you click on button
          // "--animation-input": "0.2s", // duration of animation for inputs like checkbox, toggle, radio, etc
          // "--btn-focus-scale": "0.95", // scale transform of button when you focus on it
          // "--border-btn": "1px", // border width of buttons
          // "--tab-border": "1px", // border width of tabs
          // "--tab-radius": "0.5rem", // border radius of tabs
        },
      },
    ],
    logs: false,
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
    iconsPlugin({
      collections: getIconCollections(["mdi", "flag"]),
    }),
  ],
};
