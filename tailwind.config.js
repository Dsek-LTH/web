import { iconsPlugin, getIconCollections } from "@egoist/tailwindcss-icons";

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
  daisyui: {
    themes: [
      {
        light: {
          primary: "#cc5e80",
          secondary: "#9966CC",
          accent: "#1dcdbc",
          neutral: "#2b3440",
          "base-100": "#DDDDDD",
          "base-200": "#e5e5e5",
          "base-300": "#ededed",
          info: "#0031a9",
          success: "#006800",
          warning: "#6f5500",
          error: "#a60000",
        },
      },
      {
        dark: {
          primary: "#F280A1",
          secondary: "#9966CC",
          accent: "#1fb2a6",
          neutral: "#2a323c",
          "base-100": "#252225",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
      },
    ],
    logs: false,
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
    iconsPlugin({
      collections: getIconCollections(["mdi"]),
    }),
  ],
};
