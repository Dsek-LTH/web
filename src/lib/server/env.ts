// eslint-disable-next-line no-restricted-imports -- this module is the one wrapper around $env/dynamic/private
import { env as privateEnv } from "$env/dynamic/private";
import { checkEnv, defineEnv, type EnvSpec } from "$lib/env/define";
import { publicEnv, publicEnvSpec } from "$lib/env/public";

/**
 * Server-only environment variables. Add new variables here, not in `.env` alone.
 *
 * Keep `required` to what every page needs: anything that only powers a feature
 * should name that feature, so the app can still run without it.
 */
const envSpec = {
  // Read by Prisma directly, listed here so a missing value fails at startup.
  // POSTGRES_URL_NON_POOLING is only needed when running migrations.
  POSTGRES_URL: { required: true },
  AUTH_SECRET: { required: true },

  AUTH_AUTHENTIK_CLIENT_ID: { feature: "login" },
  AUTH_AUTHENTIK_CLIENT_SECRET: {}, // empty for the public dev client

  MINIO_ENDPOINT: { default: "localhost" },
  MINIO_PORT: {},
  MINIO_USE_SSL: {},
  MINIO_ROOT_USER: { feature: "file storage" },
  MINIO_ROOT_PASSWORD: { feature: "file storage" },

  MEILISEARCH_HOST: { feature: "search" },
  MEILISEARCH_MASTER_KEY: { feature: "search" },
  POPPLER_SERVER_URL: { feature: "search in documents" },

  SHLINK_ENDPOINT: { feature: "link shortener" },
  SHLINK_API_KEY: { feature: "link shortener" },

  MEDIAWIKI_ENDPOINT: { feature: "wiki" },
  MEDIAWIKI_USERNAME: { feature: "wiki" },
  MEDIAWIKI_PASSWORD: { feature: "wiki" },

  SCHEDULER_ENDPOINT: { feature: "scheduled news" },
  SCHEDULER_PASSWORD: { feature: "scheduled news" },
  TICKET_SERVICE_ENDPOINT: { feature: "tickets" },
  SYNC_PASSWORD: { feature: "search sync endpoint" },
  MINECRAFT_URL: { feature: "minecraft status" },

  ORIGIN: { default: "http://localhost:5173" },
  MOCK_IS_APP: {},
  PRISMA_LOG_LEVEL: {},
} satisfies EnvSpec;

export const env = defineEnv(envSpec, (name) => privateEnv[name]);

/**
 * Throws if a required variable is unset, and logs which features are turned off.
 * Runs at server startup, not on import, since building doesn't have these values.
 */
export function validateEnv() {
  const server = checkEnv(envSpec, env);
  const client = checkEnv(publicEnvSpec, publicEnv);

  const missing = [...server.missing, ...client.missing];
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  const disabled = new Map(server.disabled);
  for (const [feature, names] of client.disabled) {
    disabled.set(feature, [...(disabled.get(feature) ?? []), ...names]);
  }
  for (const [feature, names] of disabled) {
    console.warn(`[env] ${feature} is turned off, set: ${names.join(", ")}`);
  }
}
