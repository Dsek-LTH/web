import { defineConfig } from "@playwright/test";

// Doesn't override what's already set, so POSTGRES_URL can point elsewhere
process.loadEnvFile(".env");

const APP_PORT = 4173;
const FAKE_OIDC_PORT = 4455;
const FAKE_OIDC_URL = `http://localhost:${FAKE_OIDC_PORT}`;
const ISSUER = `${FAKE_OIDC_URL}/application/o/test/`;

/**
 * Runs against the production build, through the same entry point as the
 * Docker image, so run `pnpm build` first. Authentik and the ticket service are
 * replaced by a fake, see tests/e2e/fake-oidc.mjs.
 */
export default defineConfig({
  testMatch: /(.+\.)?spec\.[jt]s/,
  globalSetup: "./tests/e2e/global-setup.ts",
  // The tests share a single fake identity provider
  workers: 1,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    locale: "en-US",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node tests/e2e/fake-oidc.mjs",
      url: `${ISSUER}.well-known/openid-configuration`,
      env: { FAKE_OIDC_PORT: String(FAKE_OIDC_PORT) },
    },
    {
      command: "node --env-file=.env prod/server.js",
      url: `http://localhost:${APP_PORT}`,
      env: {
        PORT: String(APP_PORT),
        ORIGIN: `http://localhost:${APP_PORT}`,
        AUTH_AUTHENTIK_CLIENT_ID: "e2e-client",
        AUTH_AUTHENTIK_CLIENT_SECRET: "e2e-secret",
        PUBLIC_AUTH_AUTHENTIK_ISSUER: ISSUER,
        PUBLIC_AUTH_AUTHENTIK_TOKEN_ENDPOINT: `${FAKE_OIDC_URL}/application/o/token/`,
        TICKET_SERVICE_ENDPOINT: `${FAKE_OIDC_URL}/tickets`,
      },
    },
  ],
});
