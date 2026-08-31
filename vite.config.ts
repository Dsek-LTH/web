import { sveltekit } from "@sveltejs/kit/vite";
import { cjsInterop } from "vite-plugin-cjs-interop";
import { defineConfig } from "vitest/config";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
  plugins: [
    sveltekit(),
    // `vitest/config`'s `defineConfig` pins its own (older) `vite` types for
    // the `test` field, which conflicts structurally with the `vite` version
    // paraglideVitePlugin is built against. Cast to sidestep the mismatch;
    // it's still the same plugin object at runtime.
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/translations/paraglide",
      strategy: [
        "custom-userPreference",
        "cookie",
        "preferredLanguage",
        "baseLocale",
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
    }) as any,
    cjsInterop({
      dependencies: ["@zenstackhq/server/**"],
    }),
  ],
  define: {
    SUPERFORMS_LEGACY: true, // due to breaking changes in superforms v2
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
