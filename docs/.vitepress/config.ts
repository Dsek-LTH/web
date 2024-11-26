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
      { text: "History", link: "/history/timeline" },
    ],

    sidebar: {
      "/history": [
        {
          text: "Tidslinje",
          link: "/history/timeline",
        },
        {
          text: "Memoranda",
          link: "/history/memoranda",
        },
      ],
      "/": [
        {
          text: "Guides",
          items: [
            { text: "Getting started", link: "/guides/getting-started" },
            { text: "Setting up VS Code", link: "/guides/vscode" },
            { text: "Next steps", link: "/guides/next-steps" },
            { text: "Load testing", link: "/guides/load-testing" },
            { text: "Using feature flags", link: "/guides/featureflags" },
          ],
        },
        {
          text: "Tutorials",
          items: [
            { text: "HTML", link: "/tutorials/html" },
            { text: "CSS", link: "/tutorials/css" },
            { text: "JavaScript", link: "/tutorials/javascript" },
            { text: "TypeScript", link: "/tutorials/typescript" },
            { text: "Svelte", link: "/tutorials/svelte" },
            { text: "SvelteKit", link: "/tutorials/sveltekit" },
            { text: "Prisma", link: "/tutorials/prisma" },
            { text: "ZenStack", link: "/tutorials/zenstack" },
            { text: "Git", link: "/tutorials/git" },
          ],
        },
        {
          text: "Explanation",
          items: [
            {
              text: "Code style",
              link: "/explanation/code-style",
            },
            {
              text: "Design",
              link: "/explanation/design",
            },
            {
              text: "Tech stack",
              link: "/explanation/tech-stack",
            },
            {
              text: "Goals",
              link: "/explanation/goals",
            },
          ],
        },
        {
          text: "Reference",
          items: [
            {
              text: "External systems",
              link: "/reference/external-systems",
            },
          ],
        },
        {
          items: [
            { text: "FAQ", link: "/faq" },
            { text: "About", link: "/about" },
          ],
        },
      ],
    },

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
