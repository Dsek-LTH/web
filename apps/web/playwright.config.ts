import { defineConfig } from "@playwright/test";
import { API_URL, WEB_URL } from "./e2e/servers";

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
    baseURL: WEB_URL,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "./e2e/api.sh",
      url: API_URL + "/me",
      timeout: 5 * 60_000,
      // Never reuse: a server already on the port could be on another
      // database.
      reuseExistingServer: false,
      stdout: "ignore",
    },
    {
      // Built with the test backend's URL, which is compiled in
      // ($env/static/public), and served the way it is deployed.
      command: `PUBLIC_GO_BACKEND_URL=${API_URL} pnpm build && ORIGIN=${WEB_URL} PORT=4173 node --env-file=.env prod/server.js`,
      url: WEB_URL,
      timeout: 5 * 60_000,
      reuseExistingServer: false,
    },
  ],
});
