<script lang="ts">
  import { page } from "$app/stores";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { NotificationSchema } from "$lib/zod/schemas";
  import { signIn } from "@auth/sveltekit/client";
  import type { Notification } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import DarkLightToggle from "./DarkLightToggle.svelte";
  import DsekLogo from "./DsekLogo.svelte";
  import LanguageSwitcher from "./LanguageSwitcher.svelte";
  import NotificationBell from "./NotificationBell.svelte";
  import UserMenu from "./UserMenu.svelte";
  import { routes } from "./routes";
  import type { UserShopItemCounts } from "$lib/server/shop/countUserShopItems";
    import Search from "$lib/components/Search.svelte";
  $: notifications = $page.data["notifications"] as Notification[] | null;
  $: deleteNotificationForm = $page.data[
    "deleteNotificationForm"
  ] as SuperValidated<NotificationSchema> | null;
  $: shopItemCounts = $page.data["shopItemCounts"] as UserShopItemCounts;
</script>

<div
  class="sticky top-0 z-10 bg-base-300 bg-opacity-60 filter backdrop-blur transition-all"
>
  <div class="container navbar mx-auto">
    <!-- Open drawer icon -->
    <div class="block xl:hidden">
      <label
        for="main-drawer"
        aria-label="open sidebar"
        class="btn btn-square btn-ghost"
      >
        <span class="i-mdi-menu h-8 w-8 text-primary" />
      </label>
    </div>

    <!-- Navbar content -->
    <div class="container hidden flex-1 xl:block">
      {#each routes as route (route.title)}
        {#if !route.accessRequired || isAuthorized(route.accessRequired, $page.data.user)}
          {#if route?.children?.length}
            <div class="dropdown dropdown-hover">
              <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label tabindex="0" class="btn btn-ghost">
                {#if route.isDsekIcon}
                  <DsekLogo className="size-6 text-primary" />
                {:else}
                  <span class={`${route.icon} size-6 text-primary`} />
                {/if}
                {route.title}</label
              >
              <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
              <ul
                tabindex="0"
                class="menu dropdown-content z-[1] w-52 rounded-box bg-base-200 p-2 shadow"
              >
                {#each route.children as child (child.title)}
                  {#if !child.accessRequired || isAuthorized(child.accessRequired, $page.data.user)}
                    <li>
                      <a
                        href={child.path}
                        class="btn-ghost active:!bg-primary/10"
                      >
                        <span class={`${child.icon} size-6 text-primary`} />
                        {child.title}</a
                      >
                    </li>
                  {/if}
                {/each}
              </ul>
            </div>
          {:else}
            <a class="btn btn-ghost" href={route.path}>
              {#if route.isDsekIcon}
                <DsekLogo className="size-6 text-primary" />
              {:else}
                <span class={`${route.icon} size-6 text-primary`} />
              {/if}
              {route.title}
            </a>
          {/if}
        {/if}
      {/each}
    </div>
    <Search />
    <div class="flex">
      <div class="hidden xl:flex">
        <!-- This will be shown in the drawer instead. -->
        <DarkLightToggle />
        <LanguageSwitcher />
      </div>

      {#if $page.data.user && $page.data.member}
        {#if notifications !== null && notifications !== undefined && deleteNotificationForm !== null}
          <NotificationBell
            {notifications}
            deleteForm={deleteNotificationForm}
          />
        {/if}
        <UserMenu
          user={$page.data.user}
          member={$page.data.member}
          {shopItemCounts}
        />
      {:else}
        <button class="btn btn-ghost" on:click={() => signIn("keycloak")}>
          Logga in
        </button>
      {/if}
    </div>
  </div>
</div>
