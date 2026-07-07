import { getFileUrl } from "$lib/files/client";
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
      title: m.applicant(),
      pictureUrl:
        getFileUrl("minio/files/public/photos/infinityfest.webp") ?? "",
      path: null,
      accessRequired: null,
      pictureTitle: m.nollning_nav_picture_title(),
      pictureDescription: m.nollning_nav_picture_subtitle(),
      picturePath: "/nolla",
      appBehaviour: "none",
      children: [
        {
          title: m.applicant(),
          description: m.nav_applicant_description(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/applying",
        },
        {
          title: m.nav_nollning(),
          description: m.nav_nollning_description(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/nolla",
        },
        {
          title: m.nav_about_guild(),
          description: m.nav_about_guild_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/about",
        },
      ],
    },
    {
      title: m.news(),
      accessRequired: null,
      appBehaviour: "none",
      path: "/news",
      children: [
        {
          title: m.news(),
          description: m.nav_news_feed_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/news",
        },
        {
          title: m.events(),
          description: m.nav_events_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/events",
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
          title: m.nav_about_guild(),
          description: m.nav_about_guild_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/about",
        },
        {
          title: m.nav_board(),
          description: m.nav_board_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/board",
        },
        {
          title: m.documents_meetingDocuments(),
          description: m.documents_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/documents",
        },
        {
          title: m.documents_governing(),
          description: m.documents_governing_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/documents/governing",
        },
      ],
    },
    {
      title: m.nav_volunteer(),
      accessRequired: null,
      appBehaviour: "none",
      path: "/volunteer",
      list: true,
      children: [
        {
          title: m.nav_volunteer(),
          accessRequired: null,
          appBehaviour: "none",
          description: m.nav_volunteer_desc(),
          path: "/volunteer",
        },
        {
          title: m.openElections(),
          accessRequired: null,
          appBehaviour: "none",
          description: m.nav_elections_desc(),
          path: "/elections",
        },
      ],
    },
    {
      title: m.nav_member(),
      accessRequired: "_",
      appBehaviour: "none",
      path: null,
      list: true,
      children: [
        {
          title: m.tickets(),
          accessRequired: null,
          appBehaviour: "none",
          description: m.nav_tickets_desc(),
          path: "/shop/tickets",
        },
        {
          title: m.nav_booking(),
          accessRequired: null,
          appBehaviour: "none",
          description: m.nav_bookings_desc(),
          path: "/booking",
        },
        {
          title: m.nav_expenses(),
          accessRequired: null,
          appBehaviour: "none",
          description: m.nav_expenses_desc(),
          path: "/expenses",
        },
      ],
    },
    {
      title: m.admin(),
      accessRequired: apiNames.ADMIN.READ,
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
        /* Here, an act of cowardice has been performed: I did not dare remove these completely in the event that someone wants to make these pages.
        {
          title: m.nav_trivia(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/trivia",
        },
        {
          title: m.nav_studybank(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/study-bank",
        },
        */
        {
          title: m.nav_songbook(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/songbook",
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
          path: "/volunteer#engage",
        },
        {
          title: m.nav_volunteer_benefits(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/volunteer#benefits",
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
          path: "/info/for-foretag",
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
