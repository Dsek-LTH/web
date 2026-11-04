import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  webServer: {
    command: "pnpm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  testMatch: /(.+\.)?spec\.[jt]s/,
};

export default config;
