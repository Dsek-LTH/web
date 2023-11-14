import apiNames from "$lib/utils/apiNames";

export const routes = [
  {
    title: "Hem",
    path: "/",
    icon: "i-mdi-home",
  },
  {
    title: "Nyheter",
    path: "/news",
    icon: "i-mdi-newspaper",
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
      },
      {
        title: "Möteshandlingar",
        path: "/documents",
        icon: "i-mdi-text-box-multiple",
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
      },
      {
        title: "Sjungbok",
        path: "/songbook",
        icon: "i-mdi-library-music",
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
      },
    ],
  },
];
