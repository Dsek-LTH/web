import DsekLogo from "$lib/components/DsekLogo.svelte";

import { getFileUrl } from "$lib/files/client";
import apiNames from "$lib/utils/apiNames";
import * as m from "$paraglide/messages";

import Cap from "$lib/components/icons/Cap.svelte";
import CalendarDays from "@lucide/svelte/icons/calendar-days";
import Coins from "@lucide/svelte/icons/coins";
import DoorClosedLocked from "@lucide/svelte/icons/door-closed-locked";
import Files from "@lucide/svelte/icons/files";
import FileText from "@lucide/svelte/icons/file-text";
import HousePlus from "@lucide/svelte/icons/house-plus";
import Info from "@lucide/svelte/icons/info";
import Link from "@lucide/svelte/icons/link";
import Megaphone from "@lucide/svelte/icons/megaphone";
import Newspaper from "@lucide/svelte/icons/newspaper";
import ScrollText from "@lucide/svelte/icons/scroll-text";
import Send from "@lucide/svelte/icons/send";
import Settings from "@lucide/svelte/icons/settings";
import ShieldUser from "@lucide/svelte/icons/shield-user";
import UserPlus from "@lucide/svelte/icons/user-plus";
import Users from "@lucide/svelte/icons/users";
import Vote from "@lucide/svelte/icons/vote";
import type { Component } from "svelte";

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
  icon?: Component;
  isCurrentRoute?: (currentPathname: string) => boolean;
};
export const getRoutes = (): Route[] =>
  [
    {
      title: m.applicant(),
      pictureUrl:
        getFileUrl("minio/files/public/photos/staben26_mobile.webp") ?? "",
      path: null,
      accessRequired: null,
      pictureTitle: m.nollning_nav_picture_title(),
      pictureDescription: m.nollning_nav_picture_subtitle(),
      picturePath: "/nollning",
      appBehaviour: "none",
      children: [
        {
          title: m.applicant(),
          description: m.nav_applicant_description(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/applying",
          icon: Send,
        },
        {
          title: m.nav_nollning(),
          description: m.nav_nollning_description(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/nolla",
          icon: Cap,
        },
        {
          title: m.nav_about_guild(),
          description: m.nav_about_guild_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/about",
          icon: DsekLogo,
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
          icon: Newspaper,
        },
        {
          title: m.events(),
          description: m.nav_events_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/events",
          icon: CalendarDays,
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
          icon: DsekLogo,
        },
        {
          title: m.nav_board(),
          description: m.nav_board_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/board",
          icon: Users,
        },
        {
          title: m.documents_meetingDocuments(),
          description: m.documents_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/documents",
          icon: FileText,
        },
        {
          title: m.documents_governing(),
          description: m.documents_governing_desc(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/documents/governing",
          icon: ScrollText,
        },
        {
          title: m.documents_requirementProfiles(),
          description: m.documents_requirementProfilesBlurb(),
          accessRequired: null,
          appBehaviour: "none",
          path: "/documents/requirements",
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
          icon: UserPlus,
        },
        {
          title: m.openElections(),
          accessRequired: null,
          appBehaviour: "none",
          description: m.nav_elections_desc(),
          path: "/elections",
          icon: Vote,
        },
      ],
    },
    {
      title: m.nav_member(),
      accessRequired: apiNames.MEMBER.USER,
      appBehaviour: "none",
      path: null,
      list: true,
      children: [
        {
          title: m.nav_booking(),
          accessRequired: null,
          appBehaviour: "none",
          description: m.nav_bookings_desc(),
          path: "/booking",
          icon: HousePlus,
        },
        {
          title: m.nav_expenses(),
          accessRequired: null,
          appBehaviour: "none",
          description: m.nav_expenses_desc(),
          path: "https://ekonomi.dsek.se/",
          icon: Coins,
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
          icon: ShieldUser,
        },
        {
          title: m.doors(),
          path: "/admin/doors",
          accessRequired: null,
          appBehaviour: "none",
          icon: DoorClosedLocked,
        },
        {
          title: m.alerts(),
          path: "/admin/alerts",
          accessRequired: null,
          appBehaviour: "none",
          icon: Megaphone,
        },
        {
          title: m.linkShortener(),
          path: "/admin/links",
          accessRequired: null,
          appBehaviour: "none",
          icon: Link,
        },
        {
          title: m.adminSettings(),
          path: "/admin/settings",
          accessRequired: null,
          appBehaviour: "none",
          icon: Settings,
        },
        {
          title: m.files(),
          path: "/admin/minio",
          accessRequired: null,
          appBehaviour: "none",
          icon: Files,
        },
        {
          title: m.info(),
          path: "/admin/info",
          accessRequired: null,
          appBehaviour: "none",
          icon: Info,
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
    } as unknown as Route,
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
