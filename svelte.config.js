import vercelAdapter from "@sveltejs/adapter-vercel";
import nodeAdapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { execSync } from "child_process";

const adapter = process.env.VERCEL_ENV ? vercelAdapter : nodeAdapter;

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter(),

    alias: {
      $paraglide: "./src/translations/paraglide", // same as outdir for paraglide in vite.config.ts
    },
    version: {
      name: execSync("git describe --tags").toString().trim(),
    },
    csp: {
      directives: {
        "frame-ancestors": ["self localhost:* https://dsek.se"],
      },
    },
  },
};

export default config;
