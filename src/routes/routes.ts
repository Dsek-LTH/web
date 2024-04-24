import apiNames from "$lib/utils/apiNames";

export const routes = [
  {
    title: "Hem",
    path: "/",
    icon: "i-mdi-home",
    accessRequired: null,
  },
  {
    title: "Nyheter",
    path: "/news",
    icon: "i-mdi-newspaper",
    accessRequired: apiNames.NEWS.READ,
  },
  {
    title: "Evenemang",
    path: "/events",
    icon: "i-mdi-calendar",
    accessRequired: apiNames.EVENT.READ,
  },
  {
    title: "Dokument",
    path: null,
    icon: "i-mdi-text-box-multiple",
    children: [
      {
        title: "Styrdokument",
        path: "/documents/governing",
        icon: "i-mdi-gavel",
        accessRequired: null,
      },
      {
        title: "Möteshandlingar",
        path: "/documents",
        icon: "i-mdi-text-box-multiple",
        accessRequired: null,
      },
      {
        title: "Kravprofiler",
        path: "/documents/requirements",
        icon: "i-mdi-vote",
        accessRequired: null,
      },
    ],
  },
  {
    title: "Sektionen",
    path: null,
    icon: "i-mdi-account-group",
    isDsekIcon: true,
    children: [
      {
        title: "Styrelsen",
        path: "/board",
        icon: "i-mdi-account-tie",
        accessRequired: null,
      },
      {
        title: "Utskott",
        path: "/committees",
        icon: "i-mdi-account-group",
        accessRequired: null,
      },
      {
        title: "Bokningar",
        path: "/booking",
        icon: "i-mdi-calendar-cursor",
        accessRequired: apiNames.BOOKINGS.READ,
      },
      {
        title: "Sjungbok",
        path: "/songbook",
        icon: "i-mdi-library-music",
        accessRequired: null,
      },
      {
        title: "Biljetter",
        path: "/shop/tickets",
        icon: "i-mdi-ticket",
      },
    ],
  },
  {
    title: "Admin",
    path: null,
    icon: "i-mdi-security",
    accessRequired: apiNames.ADMIN.READ,
    children: [
      {
        title: "Access",
        path: "/admin/access",
        icon: "i-mdi-key",
        accessRequired: apiNames.ACCESS_POLICY.READ,
      },
      {
        title: "Dörrar",
        path: "/admin/doors",
        icon: "i-mdi-door-open",
        accessRequired: apiNames.DOOR.READ,
      },
      {
        title: "Email alias",
        path: "/admin/email-alias",
        icon: "i-mdi-email",
        accessRequired: apiNames.EMAIL_ALIAS.READ,
      },
      {
        title: "Alerts",
        path: "/admin/alerts",
        icon: "i-mdi-alert-circle",
        accessRequired: apiNames.ALERT,
      },
    ],
  },
];
