import { POST_REVEAL_PREFIX } from "$lib/components/postReveal/types";
import apiNames from "$lib/utils/apiNames";
import type { Route } from "../../routes";
import * as m from "$paraglide/messages";
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
      title: "Nollning",
      path: "/",
      icon: "nollning-logo",
      accessRequired: null,
      appBehaviour: "bottom-nav",
    },
    {
      title: m.events(),
      path: "/events",
      icon: "i-mdi-calendar-outline",
      accessRequired: apiNames.EVENT.READ,
      appBehaviour: "bottom-nav",
    },
    {
      title: m.messages(),
      path: "/messages",
      icon: "i-mdi-message-outline",
      accessRequired: apiNames.NEWS.READ,
      appBehaviour: "bottom-nav",
    },
    {
      title: m.nollning_wikia(),
      path: "/wikia",
      specialBehaviour: "cart-badge",
      icon: "i-mdi-compass-outline",
      accessRequired: null,
      appBehaviour: "bottom-nav",
      isCurrentRoute: (currentPathname: string) => {
        return currentPathname.startsWith("/wikia");
      },
    },
  ] as const;

export const appBottomNavRoutes = (routes: Route[]): Route[] =>
  routes.filter((route) => {
    return route.appBehaviour === "bottom-nav";
  });

export const getIcon = (icon: string, revealTheme: boolean) => {
  if (icon === "nollning-logo") {
    if (revealTheme) return "i-mdi-cloud-outline";
    else return "i-mdi-home";
  }
  return icon;
};
