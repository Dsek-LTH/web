import apiNames from "$lib/utils/apiNames";
import * as m from "$paraglide/messages";
import type { Route } from "../../routes";
export const POST_REVEAL_PREFIX = "/nollning";
export const getPostRevealRoute = (pathname: string) => {
  if (pathname.startsWith(POST_REVEAL_PREFIX)) {
    if (pathname === POST_REVEAL_PREFIX) {
      return "/";
    }
    return pathname.slice(POST_REVEAL_PREFIX.length);
  }
  return pathname;
};
export const getRoutes = (): Route[] =>
  [
    {
      title: "Start",
      path: "/",
      icon: "i-mdi-home-outline",
      accessRequired: null,
      appBehaviour: "bottom-nav",
    },
    {
      title: "Event",
      path: "/events",
      icon: "i-mdi-calendar-outline",
      accessRequired: apiNames.EVENT.READ,
      appBehaviour: "bottom-nav",
    },
    {
      title: "Meddelanden",
      path: "/messages",
      icon: "i-mdi-message-outline",
      accessRequired: apiNames.NEWS.READ,
      appBehaviour: "bottom-nav",
    },
    {
      title: "Wikia",
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