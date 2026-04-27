import * as m from "$paraglide/messages";

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
  list?: boolean;
  isCurrentRoute?: (currentPathname: string) => boolean;
};
export const getRoutes = (): Route[] =>
  [
    {
      title: m.news(),
      accessRequired: null,
      appBehaviour: "none",
      path: "/news",
    },
    {
      title: m.events(),
      accessRequired: null,
      appBehaviour: "none",
      path: "/events",
    },
    {
      title: m.tickets(),
      accessRequired: null,
      appBehaviour: "none",
      path: "/shop/tickets",
    },
    {
      title: m.documents(),
      description: m.documents_desc(),
      accessRequired: null,
      appBehaviour: "none",
      path: "/documents",
      list: true,
      children: [
        {
          title: m.documents_governingDocuments(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/documents/governing",
        },
        {
          title: m.documents_meetingDocuments(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/documents",
        },
        {
          title: m.documents_requirementProfiles(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/documents/requirements",
        },
        {
          title: "Gerda",
          accessRequired: null,
          appBehaviour: "none",
          path: "gerda.dsek.se",
        },
      ],
    },
    {
      title: m.nav_guild(),
      accessRequired: null,
      appBehaviour: "none",
      path: null,
      children: [
        {
          title: m.nav_board(),
          description: m.nav_board_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/board",
        },
        {
          title: m.nav_committees(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/about",
        },
        {
          title: m.openElections(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/elections",
        },
        {
          title: m.bookings(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/booking",
        },
        {
          title: m.expenses(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/expenses",
        },
        {
          title: m.songBook(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/songbook",
        },
        {
          title: m.medals(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/medals",
        },
        {
          title: m.gallery(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/gallery",
        },
      ],
    },
    {
      title: m.admin(),
      accessRequired: null,
      appBehaviour: "none",
      path: "/admin",
      children: [
        {
          title: m.access(),
          path: "/admin/access",
          accessRequired: null,
          appBehaviour: "none",
        },
        {
          title: m.doors(),
          path: "/admin/doors",
          accessRequired: null,
          appBehaviour: "none",
        },
        {
          title: m.alerts(),
          path: "/admin/alerts",
          accessRequired: null,
          appBehaviour: "none",
        },
        {
          title: m.linkShortener(),
          path: "/admin/links",
          accessRequired: null,
          appBehaviour: "none",
        },
        {
          title: m.adminSettings(),
          path: "/admin/settings",
          accessRequired: null,
          appBehaviour: "none",
        },
        {
          title: m.files(),
          path: "/admin/minio",
          accessRequired: null,
          appBehaviour: "none",
        },
        {
          title: m.info(),
          path: "/admin/info",
          accessRequired: null,
          appBehaviour: "none",
        },
        {
          title: m.qr_code(),
          path: "/admin/qr",
          accessRequired: null,
          appBehaviour: "none",
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
          path: "/about",
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
          path: "/about#committees",
        },
      ],
    },
    {
      title: m.nav_contact(),
      accessRequired: null,
      appBehaviour: "none",
      path: null,
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
          path: "/contact",
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
