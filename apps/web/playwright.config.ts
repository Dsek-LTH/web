import { defineConfig } from "@playwright/test";
import { API_URL, SESSION_COOKIE, WEB_URL } from "./e2e/servers";

const [cookieName = "", cookieValue = ""] = SESSION_COOKIE.split("=");

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
    storageState: {
      cookies: [
        {
          name: cookieName,
          value: cookieValue,
          domain: new URL(WEB_URL).hostname,
          path: "/",
          expires: -1,
          httpOnly: true,
          secure: false,
          sameSite: "Lax",
        },
        // The browser calls the API from the web app's origin, which is
        // cross-site, so like any cross-site cookie it needs SameSite=None
        // (and with it Secure, which Chromium honors on http://127.0.0.1).
        {
          name: cookieName,
          value: cookieValue,
          domain: new URL(API_URL).hostname,
          path: "/",
          expires: -1,
          httpOnly: true,
          secure: true,
          sameSite: "None",
        },
      ],
      origins: [],
    },
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
