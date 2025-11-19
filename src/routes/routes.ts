import * as m from "$paraglide/messages";

import nollningImage from "./(nollning)/nollning/(photos)/staben25_9x16.webp";
// bottom-nav: Show in the bottom navigation bar
// home-link: Show on the home page
// none: Don't show anywhere
type AppBehaviour = "bottom-nav" | "home-link" | "none";
// Special behaviours. cart-badge shows a badge with the amount of items in cart, when shown in AppBottomNav.
type RouteSpecialBehaviour = "cart-badge";
export type Route = {
  title: string;
  description?: string;
  path: string | null;
  specialBehaviour?: RouteSpecialBehaviour;
  accessRequired: string | null;
  appBehaviour: AppBehaviour;
  pictureUrl?: string;
  pictureTitle?: string;
  pictureDescription?: string;
  picturePath?: string;
  children?: Route[];
  isCurrentRoute?: (currentPathname: string) => boolean;
};
export const getRoutes = (): Route[] =>
  [
    {
      title: m.applicant(),
      pictureUrl: nollningImage,
      path: null,
      accessRequired: null,
      pictureTitle: m.nollning_nav_picture_title(),
      pictureDescription: m.nollning_theme(),
      picturePath: "/nollning",
      appBehaviour: "none",
      children: [
        {
          title: m.applicant(),
          description: m.nav_applicant_description(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/sokande",
        },
        {
          title: m.nav_nollning(),
          description: m.nav_nollning_description(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/nollning",
        },
        {
          title: m.nav_about_guild(),
          description: m.nav_about_guild_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/about-guild",
        },
      ],
    },
    {
      title: m.news(),
      accessRequired: null,
      appBehaviour: "none",
      path: "/news",
    },
    {
      title: m.nav_guild(),
      accessRequired: null,
      appBehaviour: "none",
      path: null,
      children: [
        {
          title: m.nav_about_guild(),
          description: m.nav_about_guild_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/news",
        },
        {
          title: m.nav_board(),
          description: m.nav_board_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/events",
        },
        {
          title: m.documents(),
          description: m.documents_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/documents",
        },
      ],
    },
  ] as const;

export const getFooterRoutes = (): Route[] =>
  [
    {
      title: m.applicant(),
      path: null,
      accessRequired: null,
      appBehaviour: "none",
      children: [
        {
          title: m.nav_footer_nollning(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/nollning",
        },
        {
          title: m.nav_footer_tlth(),
          accessRequired: null,
          appBehaviour: "none",
          path: "https://tlth.se",
        },
        {
          title: m.nav_footer_lth(),
          accessRequired: null,
          appBehaviour: "none",
          path: "https://lth.se",
        },
        {
          title: m.nav_footer_lunduni(),
          accessRequired: null,
          appBehaviour: "none",
          path: "https://lu.se",
        },
      ],
    },
    {
      title: m.nav_guild(),
      accessRequired: null,
      appBehaviour: "none",
      path: "/news",
      children: [
        {
          title: m.nav_about_guild(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/news",
        },
        {
          title: m.nav_trivia(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/events",
        },
        {
          title: m.nav_studybank(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/events",
        },
        {
          title: m.nav_songbook(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/documents",
        },
        {
          title: m.nav_documents(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/documents",
        },
      ],
    },
    {
      title: m.nav_engagement(),
      accessRequired: null,
      appBehaviour: "none",
      path: null,
      children: [
        {
          title: m.nav_engage_yourself(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/news",
        },
        {
          title: m.nav_volunteer_benefits(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/events",
        },
        {
          title: m.nav_committees(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/events",
        },
      ],
    },
    {
      title: m.nav_contact(),
      accessRequired: null,
      appBehaviour: "none",
      path: "/news",
      children: [
        {
          title: m.nav_for_companies(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/news",
        },
        {
          title: m.nav_contact_details(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/events",
        },
      ],
    },
  ] as const;

export const appBottomNavRoutes = (routes: Route[]): Route[] =>
  [
    {
      title: "Hem",
      icon: "dsek-icon",
      path: "/app/home",
      accessRequired: null,
      appBehaviour: "bottom-nav",
    } as Route,
  ]
    .concat(
      routes
        .flatMap((route) =>
          route.children ? [route, ...route.children] : route,
        )
        .filter((route) => {
          return route.appBehaviour === "bottom-nav";
        }),
    )
    .concat([
      {
        title: "Konto",
        // icon: "i-mdi-account-circle",
        path: "/app/account",
        accessRequired: null,
        appBehaviour: "bottom-nav",
      },
    ]);
