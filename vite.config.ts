import { sveltekit } from "@sveltejs/kit/vite";
import { cjsInterop } from "vite-plugin-cjs-interop";
import { defineConfig } from "vitest/config";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
  plugins: [
    sveltekit(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/translations/paraglide",
      strategy: [
        "custom-userPreference",
        "cookie",
        "preferredLanguage",
        "baseLocale",
      ],
    }),
    cjsInterop({
      dependencies: ["@zenstackhq/server/**"],
    }),
  ],
  define: {
    SUPERFORMS_LEGACY: true, // due to breaking changes in superforms v2
  },
  // The Typst compiler runs in a Web Worker; it uses dynamic imports, which
  // need ES module output (Vite's default "iife" can't code-split).
  worker: {
    format: "es",
  },
  test: {
    include: ["src/**/*.test.{js,ts}"],
  },
  resolve: {
    alias: {
      lib: "/src/lib",
    },
  },
});
