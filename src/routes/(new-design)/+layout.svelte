<script lang="ts">
    import DsekLogo from "$lib/components/DsekLogo.svelte";
  import NavIcon from "$lib/components/ui/nav-icon/nav-icon.svelte";
  import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.js";
  import "../../app.css";
  import { getRoutes } from "../routes";

  const routes = getRoutes();

  let props = $props();
</script>

<nav class="contents">
  <NavigationMenu.Root
    viewport={false}
    class="navbar sticky z-10 max-w-screen font-semibold top-0 bg-opacity-60 filter backdrop-blur transition-all bg-background/50"
  >
    <NavigationMenu.List class="self-center">
      {#each routes as route}
        <NavigationMenu.Item>
          {#if route?.children?.length}
            <NavigationMenu.Trigger class="gap-1 font-semibold bg-transparent">
              <NavIcon icon={route.icon} />{route.title}</NavigationMenu.Trigger
            >
            <NavigationMenu.Content>
              <div class="flex flex-col gap-2 p-2 font-semibold">
                {#each route.children as child}
                  <NavigationMenu.Link class="flex flex-row" href={child.path}>
                    <NavIcon icon={child.icon} />
                    {child.title}
                  </NavigationMenu.Link>
                {/each}
              </div>
            </NavigationMenu.Content>
          {:else}
            <NavigationMenu.Link href={route.path} class="flex flex-row">
              <NavIcon icon={route.icon} />{route.title}
            </NavigationMenu.Link>
          {/if}
        </NavigationMenu.Item>
      {/each}
    </NavigationMenu.List>
  </NavigationMenu.Root>
</nav>

<main class="h-screen w-full flex-1 overflow-x-auto">
  {@render props?.children()}
</main>
