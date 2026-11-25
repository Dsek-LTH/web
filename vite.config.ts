import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [
    sveltekit(),
    // The Typstyle formatter ships wasm-bindgen's ESM wasm integration,
    // which Vite only supports through this plugin.
    wasm(),
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
