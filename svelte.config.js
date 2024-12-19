import nodeAdapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";


/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: nodeAdapter(),

    alias: {
      $paraglide: "./src/translations/paraglide", // same as outdir for paraglide in vite.config.ts
    },
    version: {
      name: "default",
    },
  },
};

export default config;
