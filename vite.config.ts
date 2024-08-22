import { paraglide } from "@inlang/paraglide-js-adapter-sveltekit/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { cjsInterop } from "vite-plugin-cjs-interop";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sveltekit(),
    paraglide({
      project: "./project.inlang",
      outdir: "./src/translations/paraglide",
    }),
    cjsInterop({
      dependencies: ["@zenstackhq/server/**"],
    }),
  ],
  define: {
    SUPERFORMS_LEGACY: true, // due to breaking changes in superforms v2
  },
});
