import { paraglide } from "@inlang/paraglide-js-adapter-vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sveltekit(),
    paraglide({
      project: "./project.inlang",
      outdir: "./src/translations/paraglide",
    }),
  ],
});
