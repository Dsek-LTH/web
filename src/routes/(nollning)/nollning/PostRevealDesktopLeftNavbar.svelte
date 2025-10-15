<script lang="ts">
  import { page } from "$app/stores";
  import LoadingButton from "$lib/components/LoadingButton.svelte";
  import NavIcon from "$lib/components/NavIcon.svelte";
  import { signIn } from "$lib/utils/auth";
  import NotificationBell from "../../NotificationBell.svelte";
  import type { PostRevealLayoutData } from "./+layout.server";
  import { getFullName } from "$lib/utils/client/member";
  import { POST_REVEAL_PREFIX } from "$lib/components/postReveal/types";
  import LanguageSwitcher from "../../LanguageSwitcher.svelte";
  import * as m from "$paraglide/messages";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  $: revealTheme = $page.data["revealTheme"];
  $: pageData = $page.data as typeof $page.data & PostRevealLayoutData;
  $: member = $page.data.member;
  $: nollaInGroup = $page.data["phadderGroup"] as Promise<
    Pick<ExtendedPrismaModel<"PhadderGroup">, "name"> | undefined
  >;

  $: notificationsPromise = pageData["notificationsPromise"];
</script>

<!-- notification and account -->
<div class="absolute right-0 z-30 flex gap-2">
  {#if $page.data.user && $page.data.member}
    {#if notificationsPromise !== null}
      <div>
        <NotificationBell
          postReveal
          {notificationsPromise}
          form={pageData["mutateNotificationForm"]}
          buttonClass="btn btn-circle relative aspect-square size-10 !p-0 bg-base-200 "
        >
          <span class="i-mdi-bell-outline size-7" slot="loading"></span>
          <div
            class="indicator {revealTheme ? 'text-base-100' : ''}"
            let:unreadCount
          >
            {#if unreadCount > 0}
              <span
                class="translate badge indicator-item badge-primary badge-xs translate-x-0 translate-y-0"
              ></span>
            {/if}
            <span class="i-mdi-bell-outline size-7"></span>
          </div>
        </NotificationBell>
      </div>
    {/if}
    <div class="dropdown dropdown-end dropdown-hover">
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label
        tabindex="0"
        class="btn btn-circle aspect-square size-10 bg-base-200 !p-0"
      >
        <span
          class="i-mdi-account-outline size-8 {revealTheme
            ? 'text-base-100'
            : ''}"
        ></span>
      </label>
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <ul
        tabindex="0"
        class="menu dropdown-content z-[1] w-52 rounded-box bg-base-100 p-2 shadow"
      >
        {#if member}
          <li class="pointer-events-none">
            <div class="flex !flex-col items-start gap-0">
              <span class="line-clamp-1 text-left font-medium">
                {getFullName(member)}
              </span>
              {#await nollaInGroup then group}
                {#if group}
                  <span class="text-neutral">{group.name}</span>
                {/if}
              {/await}
            </div>
          </li>
        {/if}
        <div class="divider m-0"></div>
        <li>
          <a href="/members/me"
            ><span class="i-mdi-account text-2xl"></span>
            {m.navbar_userMenu_profile()}</a
          >
        </li>
        <li>
          <a href="{POST_REVEAL_PREFIX}/settings"
            ><span class="i-mdi-settings-outline text-2xl"></span>
            {m.navbar_userMenu_settings()}</a
          >
        </li>
        <li>
          <a href="{POST_REVEAL_PREFIX}/shop/inventory"
            ><span class="i-mdi-treasure-chest-outline text-2xl"></span>
            {m.navbar_userMenu_inventory()}</a
          >
        </li>
        <li>
          <a href="/">
            D-sek <span class="i-mdi-arrow-right"></span>
          </a>
        </li>
        <li>
          <LanguageSwitcher />
        </li>
      </ul>
    </div>
  {:else}
    <LoadingButton class="btn btn-ghost gap-0" onClick={() => signIn()}>
      <NavIcon class="text-inherit" icon="i-mdi-login" />
    </LoadingButton>
  {/if}
</div>
