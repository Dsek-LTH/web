<script lang="ts">
  import { page } from "$app/stores";
  import type { UserShopItemCounts } from "$lib/server/shop/countUserShopItems";
  import { i18n } from "$lib/utils/i18n";
  import NavIcon from "./NavIcon.svelte";
  import { appBottomNavRoutes, getRoutes } from "./routes";
  $: shopItemCounts = $page.data["shopItemCounts"] as UserShopItemCounts;
  $: routes = getRoutes();
  $: routesToShow = appBottomNavRoutes(routes);
  $: currentRoute = i18n.route($page.url.pathname);
  $: currentRouteIndex = routesToShow.findIndex(
    (route) => route.path === currentRoute,
  );
</script>

<div
  class="btm-nav bottom-8 left-2 right-2 w-[calc(100%-1rem)] rounded-lg bg-base-300 bg-opacity-60 filter backdrop-blur"
>
  <div
    class="absolute bottom-1 h-0.5 w-[15%] bg-primary transition-all ease-out"
    class:opacity-0={currentRouteIndex === -1}
    style="left: {currentRouteIndex * (100 / routesToShow.length) + 2.5}%"
  />
  {#each routesToShow as route (route.path)}
    <a href={route.path} class="transition-all">
      <NavIcon icon={route.icon} />
      <!-- <span class="btm-nav-label text-[0.5rem] uppercase">{route.title}</span> -->
    </a>
  {/each}
</div>
