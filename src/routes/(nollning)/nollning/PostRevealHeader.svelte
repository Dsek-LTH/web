<script lang="ts">
  import { page } from "$app/stores";
  import LoadingButton from "$lib/components/LoadingButton.svelte";
  import NavIcon from "$lib/components/NavIcon.svelte";
  import { pageTitle } from "$lib/stores/pageTitle";
  import { i18n } from "$lib/utils/i18n";
  import { signIn } from "@auth/sveltekit/client";
  import PostRevealAccountMenu from "./PostRevealAccountMenu.svelte";
  import PostRevealNotificationBell from "./PostRevealNotificationBell.svelte";
  import { appBottomNavRoutes, getPostRevealRoute, getRoutes } from "./routes";
  $: routes = getRoutes();
  $: bottomNavRoutes = appBottomNavRoutes(routes);
  $: currentRoute = getPostRevealRoute(i18n.route($page.url.pathname));
  $: canGoBack = !bottomNavRoutes.some((route) =>
    route.isCurrentRoute
      ? route.isCurrentRoute(currentRoute)
      : route.path === currentRoute,
  );
  $: topInsets = $page.data.appInfo?.insets?.top ?? 0;
</script>

<header
  class="navbar top-0 z-10 justify-between gap-2 overflow-hidden bg-opacity-60 shadow-[0_4px_4px_#191B2740] filter backdrop-blur transition-all"
  style="padding-top: {topInsets + 8}px;"
>
  <div class="w-[5.5rem]">
    <button
      on:click={canGoBack ? () => window.history.back() : undefined}
      class:opacity-0={!canGoBack}
      class="-m-4 p-4"
    >
      <span class="i-mdi-chevron-left relative top-0.5 size-8" />
    </button>
  </div>

  <!-- min-w-0 is required to get text-overflow: ellipsis; to work  -->
  <div class="min-w-0 flex-1">
    <h1
      class="page-title mx-auto overflow-hidden text-ellipsis whitespace-nowrap text-xl font-bold"
    >
      {$pageTitle}
    </h1>
  </div>

  <div class="flex w-[5.5rem] justify-end gap-2">
    {#if $page.data.user && $page.data.member}
      <PostRevealNotificationBell />
      <PostRevealAccountMenu />
    {:else}
      <LoadingButton
        class="btn btn-ghost gap-0"
        onClick={() => signIn("keycloak")}
      >
        <NavIcon class="text-inherit" icon="i-mdi-login" />
      </LoadingButton>
    {/if}
  </div>
</header>
