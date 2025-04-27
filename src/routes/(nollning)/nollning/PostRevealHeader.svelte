<script lang="ts">
  import { page } from "$app/state";
  import LoadingButton from "$lib/components/LoadingButton.svelte";
  import NavIcon from "$lib/components/NavIcon.svelte";
  import NotificationModal from "$lib/components/NotificationModal.svelte";
  import { i18n } from "$lib/utils/i18n";
  import { signIn } from "@auth/sveltekit/client";
  import NotificationBell from "../../NotificationBell.svelte";
  import AccountDrawer from "./AccountDrawer.svelte";
  import PostRevealAccountMenu from "./PostRevealAccountMenu.svelte";
  import { appBottomNavRoutes, getPostRevealRoute, getRoutes } from "./routes";
  import type { PostRevealLayoutData } from "./+layout.server";
  import type { NotificationGroup } from "$lib/utils/notifications/group";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  let routes = $derived(getRoutes());
  let bottomNavRoutes = $derived(appBottomNavRoutes(routes));
  let currentRoute = $derived(
    getPostRevealRoute(i18n.route(page.url.pathname)),
  );
  let canGoBack = $derived(
    !bottomNavRoutes.some((route) =>
      route.isCurrentRoute
        ? route.isCurrentRoute(currentRoute)
        : route.path === currentRoute,
    ),
  );
  let pageData = $derived(page.data as typeof page.data & PostRevealLayoutData);
  let topInsets = $derived(page.data.appInfo?.insets?.top ?? 0);

  let notificationsPromise = $derived(pageData["notificationsPromise"]);

  let notificationModal: HTMLDialogElement = $state();
  let notifications: NotificationGroup[] | undefined = $state(undefined);

  let pageTitle = getContext<Writable<string>>("pageTitle");
</script>

<NotificationModal
  bind:modal={notificationModal}
  postReveal
  bind:notifications
/>
<header
  class="navbar justify-between gap-2 shadow-[0_4px_4px_#191B2740]"
  style="padding-top: {topInsets + 8}px;"
>
  <div class="w-[5.5rem]">
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      onclick={canGoBack ? () => window.history.back() : undefined}
      class:opacity-0={!canGoBack}
      class="-m-4 p-4"
    >
      <span class="i-mdi-chevron-left relative top-0.5 size-8"></span>
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
    {#if page.data.user && page.data.member}
      {#if notificationsPromise !== null}
        <NotificationBell
          {notificationsPromise}
          bind:notifications
          form={pageData["mutateNotificationForm"]}
          externalModal={notificationModal}
          useModalInstead
          buttonClass="btn btn-circle bg-base-200 relative aspect-square size-10 !p-0"
        >
          {#snippet loading()}
            <span class="i-mdi-bell-outline size-7"></span>
          {/snippet}
          {#snippet children({ unreadCount })}
            <div class="indicator">
              {#if unreadCount > 0}
                <span
                  class="translate badge indicator-item badge-primary badge-xs translate-x-0 translate-y-0"
                ></span>
              {/if}
              <span class="i-mdi-bell-outline size-7"></span>
            </div>
          {/snippet}
        </NotificationBell>
      {/if}
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
<AccountDrawer />
