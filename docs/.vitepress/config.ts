import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "DWWW",
  description: "Documentation for DWWW web repo",

  base: "/web/",
  lastUpdated: true,
  ignoreDeadLinks: "localhostLinks",

  markdown: {
    image: { lazyLoading: true },
  },

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
        text: "Tutorials",
        items: [
          { text: "HTML", link: "/tutorials/html" },
          { text: "CSS", link: "/tutorials/css" },
          { text: "JavaScript", link: "/tutorials/js" },
          { text: "TypeScript", link: "/tutorials/ts" },
          { text: "Svelte", link: "/tutorials/svelte" },
          { text: "SvelteKit", link: "/tutorials/sveltekit" },
          { text: "Tailwind", link: "/tutorials/tailwind" },
          { text: "SQL", link: "/tutorials/sql" },
          { text: "Prisma", link: "/tutorials/prisma" },
          { text: "ZenStack", link: "/tutorials/zenstack" },
          { text: "React Native", link: "/tutorials/react-native" },
        ],
      },
      {
        text: "Explanation",
        items: [
          {
            text: "Tech stack",
            link: "/explanation/tech-stack",
          },
        ],
      },
      {
        text: "Reference",
        items: [
          {
            text: "Environment variables",
            link: "/reference/environment-variables",
          },
        ],
      },
      {
        items: [{ text: "About", link: "/about" }],
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
