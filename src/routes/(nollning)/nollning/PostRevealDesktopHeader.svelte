<script lang="ts">
  import { page } from "$app/stores";
  import LoadingButton from "$lib/components/LoadingButton.svelte";
  import NavIcon from "$lib/components/NavIcon.svelte";
  import NotificationModal from "$lib/components/NotificationModal.svelte";
  import { signIn } from "@auth/sveltekit/client";
  import NotificationBell from "../../NotificationBell.svelte";
  import { getRoutes } from "./routes";
  import type { PostRevealLayoutData } from "./+layout.server";
  import { getFullName } from "$lib/utils/client/member";
  import { POST_REVEAL_PREFIX } from "$lib/components/postReveal/types";

  $: routes = getRoutes();
  $: pageData = $page.data as typeof $page.data & PostRevealLayoutData;
  $: member = $page.data.member;

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
        <div class="dropdown dropdown-end dropdown-hover">
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label
            tabindex="0"
            class="btn btn-circle aspect-square size-10 bg-base-200 !p-0"
          >
            <span class="i-mdi-account-outline size-8" />
          </label>
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <ul
            tabindex="0"
            class="menu dropdown-content z-[1] w-52 rounded-box bg-base-200 p-2 shadow"
          >
            <li>
              <span>
                {member &&
                  getFullName({
                    ...member,
                    nickname: null,
                  })}
              </span>
            </li>
            <div class="divider m-0"></div>
            <li>
              <a href="/members/me">Profil</a>
            </li>
            <li>
              <a href="{POST_REVEAL_PREFIX}/settings">Inställningar</a>
            </li>
            <li>
              <a href="{POST_REVEAL_PREFIX}/shop/inventory">Mina biljetter</a>
            </li>
            <li>
              <a href="/">
                Till dsek.se <span class="i-mdi-arrow-right" />
              </a>
            </li>
          </ul>
        </div>
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
