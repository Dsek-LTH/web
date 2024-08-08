import apiNames from "$lib/utils/apiNames";
import * as m from "$paraglide/messages";
import type { Route } from "../../routes";

export const getRoutes = (): Route[] =>
  [
    {
      title: m.home(),
      path: "/",
      icon: "i-mdi-home-outline",
      accessRequired: null,
      appBehaviour: "bottom-nav",
    },
    {
      title: m.news(),
      path: "/events",
      icon: "i-mdi-calendar-outline",
      accessRequired: apiNames.EVENT.READ,
      appBehaviour: "bottom-nav",
    },
    {
      title: m.events(),
      path: "/messages",
      icon: "i-mdi-message-outline",
      accessRequired: apiNames.NEWS.READ,
      appBehaviour: "bottom-nav",
    },
    {
      title: m.tickets(),
      path: "/wikia",
      specialBehaviour: "cart-badge",
      icon: "i-mdi-compass-outline",
      accessRequired: null,
      appBehaviour: "bottom-nav",
    },
  ] as const;

export const appBottomNavRoutes = (routes: Route[]): Route[] =>
  routes.filter((route) => {
    return route.appBehaviour === "bottom-nav";
  });
