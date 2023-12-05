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
    ],
  },
  {
    title: "Sektionen",
    path: null,
    icon: "i-mdi-account-group",
    isDsekIcon: true,
    children: [
      {
        title: "Utskott",
        path: "/committees",
        icon: "i-mdi-account-group",
        accessRequired: null,
      },
      {
        title: "Sjungbok",
        path: "/songbook",
        icon: "i-mdi-library-music",
        accessRequired: null,
      },
      {
        title: "Webshop",
        path: "/webshop",
        icon: "i-mdi-store",
      },
    ],
  },
  {
    title: "Admin",
    path: null,
    icon: "i-mdi-security",
    accessRequired: apiNames.ACCESS_POLICY.READ,
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
    ],
  },
];
