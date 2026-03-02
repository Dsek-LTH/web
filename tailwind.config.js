/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'], // dark mode set by class="dark" or data-theme="dark" in DOM
  mode: "jit",
  content: ["./src/**/*.{html,js,json,svelte,ts}"],
  theme: {
    extend: {
      gridTemplateColumns: {
        "1-2": "1fr 2fr",
      },
    },
  },
};
