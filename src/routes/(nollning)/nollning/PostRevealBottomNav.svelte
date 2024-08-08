<script lang="ts">
  import { page } from "$app/stores";
  import { i18n } from "$lib/utils/i18n";
  import { appBottomNavRoutes, getPostRevealRoute, getRoutes } from "./routes";
  $: routes = getRoutes();
  $: routesToShow = appBottomNavRoutes(routes);
  const prefix = "/nollning";
  $: currentRoute = getPostRevealRoute(i18n.route($page.url.pathname));
  $: bottomInsets = $page.data.appInfo?.insets?.bottom ?? 0;
</script>

<nav class="btm-nav relative inset-0" style="bottom: {bottomInsets || 0}px;">
  {#each routesToShow as route (route.path)}
    {@const isCurrent = route.path === currentRoute}
    <a
      href={`${prefix}${route.path}`}
      class:text-base-content={isCurrent}
      class:text-neutral={!isCurrent}
      class="h-12"
    >
      <span class="{route.icon} size-8" />
      <span class="text-xs">{route.title}</span>
    </a>
  {/each}
</nav>
