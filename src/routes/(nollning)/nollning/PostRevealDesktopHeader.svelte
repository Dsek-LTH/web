<script lang="ts">
  import { page } from "$app/stores";
  import LoadingButton from "$lib/components/LoadingButton.svelte";
  import NavIcon from "$lib/components/NavIcon.svelte";
  import NotificationModal from "$lib/components/NotificationModal.svelte";
  import { signIn } from "@auth/sveltekit/client";
  import NotificationBell from "../../NotificationBell.svelte";
  import AccountDrawer from "./AccountDrawer.svelte";
  import PostRevealAccountMenu from "./PostRevealAccountMenu.svelte";
  import { getRoutes } from "./routes";
  import type { PostRevealLayoutData } from "./+layout.server";

  $: routes = getRoutes();
  $: pageData = $page.data as typeof $page.data & PostRevealLayoutData;

  const prefix = "/nollning";
  let notificationModal: HTMLDialogElement;
</script>

<NotificationModal bind:modal={notificationModal} />
<header class="navbar justify-center shadow-[0_4px_4px_#191B2740]">
  <div class="container relative flex justify-center gap-4">
    <!-- routes -->
    {#each routes as route}
      <a
        class="btn btn-outline text-xl font-bold"
        href={`${prefix}${route.path}`}
      >
        {route.title}
      </a>
    {/each}
    <!-- notification and account -->
    <div class="absolute right-0 flex gap-2">
      {#if $page.data.user && $page.data.member}
        {#if pageData["notifications"] !== null}
          <NotificationBell
            notifications={pageData["notifications"]}
            form={pageData["mutateNotificationForm"]}
            externalModal={notificationModal}
            useModalInstead
            buttonClass="btn btn-circle bg-base-200 relative aspect-square size-10 !p-0"
          >
            <div let:unreadCount class="indicator">
              {#if unreadCount > 0}
                <span
                  class="translate badge indicator-item badge-primary badge-xs translate-x-0 translate-y-0"
                ></span>
              {/if}
              <span class="i-mdi-bell-outline size-7" />
            </div>
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
  </div>
</header>
<AccountDrawer />
