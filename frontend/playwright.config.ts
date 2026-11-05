import { defineConfig } from "@playwright/test";
import { BACKEND_URL, FRONTEND_URL } from "./e2e/servers";

// End-to-end tests (pnpm test:integration): a production build in a real
// browser against a real backend. See "End-to-end tests" in AGENTS.md.
export default defineConfig({
  testDir: "e2e",
  // The flow tests write to the shared database; the route sweep is quick
  // enough serially that ordering issues aren't worth having.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "./e2e/backend.sh",
      url: BACKEND_URL + "/me",
      timeout: 5 * 60_000,
      // Never reuse: a server already on the port could be on another
      // database.
      reuseExistingServer: false,
      stdout: "ignore",
    },
    {
      // Built with the test backend's URL, which is compiled in
      // ($env/static/public), and served the way it is deployed.
      command: `PUBLIC_GO_BACKEND_URL=${BACKEND_URL} pnpm build && ORIGIN=${FRONTEND_URL} PORT=4173 node --env-file=.env prod/server.js`,
      url: FRONTEND_URL,
      timeout: 5 * 60_000,
      reuseExistingServer: false,
    },
  ],
});
