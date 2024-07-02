<script lang="ts">
  import { page } from "$app/stores";
  import { isAuthorized } from "$lib/utils/authorization";
  import NavIcon from "$lib/components/NavIcon.svelte";
  import { getRoutes, type Route } from "../../../routes";

  $: routes = getRoutes();
  $: routesToShow = routes
    .filter(
      // first filter out all routes not accessible (root-level paths only)
      (route) =>
        !route.accessRequired ||
        isAuthorized(route.accessRequired, $page.data.user),
    )
    .flatMap(
      (
        route, // then merge children into list
      ) =>
        route.children
          ? [
              route,
              ...route.children.map((child) => ({ ...child, parent: route })),
            ]
          : route,
    )
    .filter((route) => {
      // filter out pages to those which should be shown here
      return route.appBehaviour === "home-link";
    })
    .filter(
      // filter out based on accessibility AGAIN, this time for children
      (route) =>
        !route.accessRequired ||
        isAuthorized(route.accessRequired, $page.data.user),
    ) as Array<Route & { parent?: Route }>;
</script>

<ul class="menu gap-2 rounded-box border-t-4 border-t-primary bg-base-300 p-4">
  {#each routesToShow as route, index (route.path)}
    {@const didChangeCategory =
      route.parent?.title !== routesToShow[index - 1]?.parent?.title}
    {#if didChangeCategory}
      <li class="menu-title">{route.parent?.title}</li>
    {/if}
    <li>
      <a href={route.path} class="pop-out btn justify-start">
        <NavIcon icon={route.icon} />
        <span>{route.title}</span>
      </a>
    </li>
  {/each}
</ul>
