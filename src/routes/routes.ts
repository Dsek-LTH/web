import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
import apiNames from "$lib/utils/apiNames";
import * as m from "$paraglide/messages";

// bottom-nav: Show in the bottom navigation bar
// home-link: Show on the home page
// none: Don't show anywhere
type AppBehaviour = "bottom-nav" | "home-link" | "none";
// Special behaviours. cart-badge shows a badge with the amount of items in cart, when shown in AppBottomNav.
type RouteSpecialBehaviour = "cart-badge";
export type Route = {
  title: string;
  path: string | null;
  specialBehaviour?: RouteSpecialBehaviour;
  icon: string;
  accessRequired: string | null;
  appBehaviour: AppBehaviour;
  children?: Route[];
  isCurrentRoute?: (currentPathname: string) => boolean;
};
export const getRoutes = (): Route[] =>
  [
    {
      title: m.home(),
      path: "/",
      icon: "i-mdi-home",
      accessRequired: null,
      appBehaviour: "none",
    },
    {
      title: m.news(),
      path: "/news",
      icon: "i-mdi-newspaper",
      accessRequired: apiNames.NEWS.READ,
      appBehaviour: "bottom-nav",
    },
    {
      title: m.events(),
      path: "/events",
      icon: "i-mdi-calendar",
      accessRequired: apiNames.EVENT.READ,
      appBehaviour: "bottom-nav",
    },
    {
      title: m.tickets(),
      path: "/shop/tickets",
      specialBehaviour: "cart-badge",
      icon: "i-mdi-ticket",
      accessRequired: apiNames.WEBSHOP.PURCHASE,
      appBehaviour: "bottom-nav",
    },
    {
      title: m.documents(),
      path: null,
      icon: "i-mdi-text-box-multiple",
      appBehaviour: "none",
      accessRequired: null,
      children: [
        {
          title: m.documents_governingDocuments(),
          path: "/documents/governing",
          icon: "i-mdi-gavel",
          accessRequired: null,
          appBehaviour: "home-link",
        },
        {
          title: m.documents_meetingDocuments(),
          path: "/documents",
          icon: "i-mdi-text-box-multiple",
          accessRequired: null,
          appBehaviour: "home-link",
        },
        {
          title: m.documents_requirementProfiles(),
          path: "/documents/requirements",
          icon: "i-mdi-vote",
          accessRequired: null,
          appBehaviour: "home-link",
        },
      ],
    },
    {
      title: m.theGuild(),
      path: null,
      icon: "dsek-icon",
      accessRequired: null,
      appBehaviour: "none",
      children: [
        {
          title: m.theBoard(),
          path: "/board",
          icon: "i-mdi-account-tie",
          accessRequired: null,
          appBehaviour: "home-link",
        },
        {
          title: m.committees(),
          path: "/committees",
          icon: "i-mdi-account-group",
          accessRequired: null,
          appBehaviour: "home-link",
        },
        {
          title: m.bookings(),
          path: "/booking",
          icon: "i-mdi-calendar-cursor",
          accessRequired: apiNames.BOOKINGS.READ,
          appBehaviour: "home-link",
        },
        {
          title: m.songBook(),
          path: "/songbook",
          icon: "i-mdi-library-music",
          accessRequired: null,
          appBehaviour: "home-link",
        },
      ],
    },
    {
      title: m.admin(),
      path: null,
      icon: "i-mdi-security",
      accessRequired: apiNames.ADMIN.READ,
      appBehaviour: "none",
      children: [
        {
          title: m.access(),
          path: "/admin/access",
          icon: "i-mdi-key",
          accessRequired: apiNames.ACCESS_POLICY.READ,
          appBehaviour: "home-link",
        },
        {
          title: m.doors(),
          path: "/admin/doors",
          icon: "i-mdi-door-open",
          accessRequired: apiNames.DOOR.READ,
          appBehaviour: "home-link",
        },
        {
          title: m.emailAliases(),
          path: "/admin/email-alias",
          icon: "i-mdi-email",
          accessRequired: apiNames.EMAIL_ALIAS.READ,
          appBehaviour: "home-link",
        },
        {
          title: m.alerts(),
          path: "/admin/alerts",
          icon: "i-mdi-alert-circle",
          accessRequired: apiNames.ALERT,
          appBehaviour: "home-link",
        },
        {
          title: m.linkShortener(),
          path: "/admin/links",
          icon: "i-mdi-link-variant",
          accessRequired: apiNames.DOOR.READ, //temporary, make right api access here as well
          appBehaviour: "home-link",
        },
        {
          title: m.adminSettings(),
          path: "/admin/settings",
          icon: "i-mdi-wrench",
          accessRequired: apiNames.ADMIN.SETTINGS.READ,
          appBehaviour: "home-link",
        },
        {
          title: m.files(),
          path: "/admin/minio",
          icon: "i-mdi-files",
          accessRequired: apiNames.FILES.BUCKET(PUBLIC_BUCKETS_FILES).CREATE,
          appBehaviour: "home-link",
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
        icon: "i-mdi-account-circle",
        path: "/app/account",
        accessRequired: null,
        appBehaviour: "bottom-nav",
      },
    ]);
