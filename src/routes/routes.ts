import apiNames from "$lib/utils/apiNames";
import * as m from "$paraglide/messages";

export const getRoutes = () => [
  {
    title: m.home(),
    path: "/",
    icon: "i-mdi-home",
    accessRequired: null,
  },
  {
    title: m.news(),
    path: "/news",
    icon: "i-mdi-newspaper",
    accessRequired: apiNames.NEWS.READ,
  },
  {
    title: m.events(),
    path: "/events",
    icon: "i-mdi-calendar",
    accessRequired: apiNames.EVENT.READ,
  },
  {
    title: m.tickets(),
    path: "/shop/tickets",
    icon: "i-mdi-ticket",
    accessRequired: apiNames.WEBSHOP.PURCHASE,
  },
  {
    title: m.documents(),
    path: null,
    icon: "i-mdi-text-box-multiple",
    children: [
      {
        title: m.documents_governingDocuments(),
        path: "/documents/governing",
        icon: "i-mdi-gavel",
        accessRequired: null,
      },
      {
        title: m.documents_meetingDocuments(),
        path: "/documents",
        icon: "i-mdi-text-box-multiple",
        accessRequired: null,
      },
      {
        title: m.documents_requirementProfiles(),
        path: "/documents/requirements",
        icon: "i-mdi-vote",
        accessRequired: null,
      },
    ],
  },
  {
    title: m.theGuild(),
    path: null,
    icon: "i-mdi-account-group",
    isDsekIcon: true,
    children: [
      {
        title: m.theBoard(),
        path: "/board",
        icon: "i-mdi-account-tie",
        accessRequired: null,
      },
      {
        title: m.committees(),
        path: "/committees",
        icon: "i-mdi-account-group",
        accessRequired: null,
      },
      {
        title: m.bookings(),
        path: "/booking",
        icon: "i-mdi-calendar-cursor",
        accessRequired: apiNames.BOOKINGS.READ,
      },
      {
        title: m.songBook(),
        path: "/songbook",
        icon: "i-mdi-library-music",
        accessRequired: null,
      },
    ],
  },
  {
    title: m.admin(),
    path: null,
    icon: "i-mdi-security",
    accessRequired: apiNames.ADMIN.READ,
    children: [
      {
        title: m.access(),
        path: "/admin/access",
        icon: "i-mdi-key",
        accessRequired: apiNames.ACCESS_POLICY.READ,
      },
      {
        title: m.doors(),
        path: "/admin/doors",
        icon: "i-mdi-door-open",
        accessRequired: apiNames.DOOR.READ,
      },
      {
        title: m.emailAliases(),
        path: "/admin/email-alias",
        icon: "i-mdi-email",
        accessRequired: apiNames.EMAIL_ALIAS.READ,
      },
      {
        title: m.alerts(),
        path: "/admin/alerts",
        icon: "i-mdi-alert-circle",
        accessRequired: apiNames.ALERT,
      },
    ],
  },
];
