import { sveltekit } from "@sveltejs/kit/vite";
import { cjsInterop } from "vite-plugin-cjs-interop";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

// Survives the in-process restart Vite does when an env file changes.
const globals = globalThis as typeof globalThis & {
  initialProcessEnv?: NodeJS.ProcessEnv;
};
const initialProcessEnv = (globals.initialProcessEnv ??= { ...process.env });

/**
 * Makes `process.env` match what SvelteKit sees in dev: real environment
 * variables first, then `.env.[mode].local`, `.env.[mode]`, `.env.local`, `.env`.
 *
 * The Prisma client copies `.env` into `process.env` when it's constructed, and
 * Vite's `loadEnv` prefers `process.env` over env files. Without this reset, those
 * stale values win after a restart: edits are ignored and `.env.local` overrides
 * are lost. Setting the merged values up front also means Prisma, whose loader
 * never overwrites existing variables, respects `.env.local`.
 */
function syncProcessEnv(mode: string) {
  for (const key of Object.keys(process.env)) {
    if (!(key in initialProcessEnv)) delete process.env[key];
  }
  Object.assign(process.env, initialProcessEnv);
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
}

export default defineConfig(({ command, mode }) => {
  if (command === "serve" && mode !== "test") syncProcessEnv(mode);

  return {
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
    test: {
      include: ["src/**/*.test.{js,ts}"],
    },
    resolve: {
      alias: {
        lib: "/src/lib",
      },
    },
  };
});
