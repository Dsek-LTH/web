import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "DWWW",
  description: "Documentation for DWWW web repo",

  base: "/web/",
  lastUpdated: true,
  ignoreDeadLinks: "localhostLinks",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      dark: "/dwww-logo-dark.svg",
      light: "/dwww-logo-light.svg",
      alt: "DWWW Logo",
    },

    nav: [
      { text: "Home", link: "/" },
      { text: "Examples", link: "/markdown-examples" },
    ],

    sidebar: [
      {
        text: "Guides",
        items: [{ text: "Getting started", link: "/guides/getting-started" }],
      },
      {
        text: "Examples",
        items: [
          { text: "Markdown Examples", link: "/markdown-examples" },
          { text: "Runtime API Examples", link: "/api-examples" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/Dsek-LTH/web" }],

    search: {
      provider: "local",
    },
  },

  head: [
    ["link", { rel: "icon", href: "favicon.svg", type: "image/svg+xml" }],
    ["link", { rel: "icon", href: "favicon.png", type: "image/png" }],
  ],
});
