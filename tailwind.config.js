import { iconsPlugin, getIconCollections } from "@egoist/tailwindcss-icons";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      {
        light: {
          primary: "#F280A1",
          secondary: "#9966CC",
          accent: "#1dcdbc",
          neutral: "#2b3440",
          "base-100": "#efefef",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
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
