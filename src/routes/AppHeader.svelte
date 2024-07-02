<script lang="ts">
  import { page } from "$app/stores";
  import type { NotificationSchema } from "$lib/zod/schemas";
  import { signIn } from "@auth/sveltekit/client";
  import type { Notification } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import NotificationBell from "./NotificationBell.svelte";
  import { appBottomNavRoutes, getRoutes } from "./routes";
  import { pageTitle } from "$lib/stores/pageTitle";
  import { i18n } from "$lib/utils/i18n";
  import NavIcon from "$lib/components/NavIcon.svelte";
  import LoadingButton from "$lib/components/LoadingButton.svelte";
  $: notifications = $page.data["notifications"] as Notification[] | null;
  $: deleteNotificationForm = $page.data[
    "deleteNotificationForm"
  ] as SuperValidated<NotificationSchema> | null;
  $: routes = getRoutes();
  $: bottomNavRoutes = appBottomNavRoutes(routes).map((route) => route.path);
  $: canGoBack = !bottomNavRoutes.includes(i18n.route($page.url.pathname));
  $: topInsets = $page.data.appInfo?.insets?.top ?? 0;
</script>

<div
  class="navbar sticky top-0 z-10 justify-between bg-base-300 bg-opacity-60 filter backdrop-blur transition-all"
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

  <div class="text-xl font-bold">{$pageTitle}</div>

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
</div>
