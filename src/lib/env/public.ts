// eslint-disable-next-line no-restricted-imports -- this module is the one wrapper around $env/dynamic/public
import { env } from "$env/dynamic/public";
import { defineEnv, type EnvSpec } from "./define";

/**
 * Environment variables that are also sent to the browser, so they must never
 * hold secrets. See `$lib/server/env` for server-only variables.
 */
export const publicEnvSpec = {
  PUBLIC_AUTH_AUTHENTIK_ISSUER: { required: true },
  PUBLIC_AUTH_AUTHENTIK_TOKEN_ENDPOINT: {
    default: "https://auth.dsek.se/application/o/token/",
  },

  PUBLIC_MINIO_BASE_URL: { feature: "file storage" },
  PUBLIC_BUCKETS_ALBUMS: { default: "albums" },
  PUBLIC_BUCKETS_DOCUMENTS: { default: "documents" },
  PUBLIC_BUCKETS_FILES: { default: "files" },
  PUBLIC_BUCKETS_MEMBERS: { default: "members" },

  PUBLIC_DISABLE_SSR_GLOBALLY: {},
  PUBLIC_VERCEL_ENV: {},
} satisfies EnvSpec;

export const publicEnv = defineEnv(publicEnvSpec, (name) => env[name]);
