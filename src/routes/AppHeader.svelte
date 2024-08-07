<script lang="ts">
  import { page } from "$app/stores";
  import LoadingButton from "$lib/components/LoadingButton.svelte";
  import NavIcon from "$lib/components/NavIcon.svelte";
  import { pageTitle } from "$lib/stores/pageTitle";
  import { i18n } from "$lib/utils/i18n";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import type { NotificationSchema } from "$lib/zod/schemas";
  import { signIn } from "@auth/sveltekit/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import NotificationBell from "./NotificationBell.svelte";
  import { appBottomNavRoutes, getRoutes } from "./routes";
  $: notifications = $page.data["notifications"] as NotificationGroup[] | null;
  $: deleteNotificationForm = $page.data[
    "deleteNotificationForm"
  ] as SuperValidated<NotificationSchema> | null;
  $: routes = getRoutes();
  $: bottomNavRoutes = appBottomNavRoutes(routes).map((route) => route.path);
  $: canGoBack = !bottomNavRoutes.includes(i18n.route($page.url.pathname));
  $: topInsets = $page.data.appInfo?.insets?.top ?? 0;
</script>

<header
  class="navbar sticky top-0 z-10 justify-between gap-2 overflow-hidden bg-base-300 bg-opacity-60 filter backdrop-blur transition-all"
  style="padding-top: {topInsets + 8}px;"
>
  <div class="w-16">
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
      class="mx-auto overflow-hidden text-ellipsis whitespace-nowrap text-xl font-bold"
    >
      {$pageTitle}
    </h1>
  </div>

  <div class="w-16">
    {#if $page.data.user && $page.data.member}
      {#if notifications !== null && notifications !== undefined && deleteNotificationForm !== null}
        <NotificationBell {notifications} deleteForm={deleteNotificationForm} />
      {/if}
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
