import vercelAdapter from "@sveltejs/adapter-vercel";
import nodeAdapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { env } from "process";

const adapter = process.env.VERCEL_ENV ? vercelAdapter : nodeAdapter;
const version =
  env.VERSION ||
  (existsSync(".git")
    ? execSync("git rev-parse HEAD").toString().trim()
    : undefined);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter(),

    appDir: "_redesign",

    alias: {
      $paraglide: "./src/translations/paraglide", // same as outdir for paraglide in vite.config.ts
      $database: "./src/database",
    },
    version: version ? { name: version } : {},
    experimental: {
      remoteFunctions: true,
      tracing: {
        server: true,
      },
      instrumentation: {
        server: true,
      },
    },
  },
  compilerOptions: {
    experimental: {
      async: true,
    },
  },
};

export default config;
