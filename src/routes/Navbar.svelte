<script lang="ts">
  import { page } from "$app/stores";
  import { signIn, signOut } from "@auth/sveltekit/client";
  import DarkLightToggle from "./DarkLightToggle.svelte";
  import DsekLogo from "./DsekLogo.svelte";
  import LanguageSwitcher from "./LanguageSwitcher.svelte";
  import { routes } from "./routes";
  import { isAuthorized } from "$lib/utils/authorization";
  import { getFullName } from "$lib/utils/client/member";
  import NotificationBell from "./NotificationBell.svelte";
  import type { Notification } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { NotificationSchema } from "$lib/zod/schemas";
  $: notifications = $page.data["notifications"] as Notification[] | null;
  $: deleteNotificationForm = $page.data[
    "deleteNotificationForm"
  ] as SuperValidated<NotificationSchema> | null;
</script>

<div
  class="sticky top-0 z-10 bg-base-300 bg-opacity-60 filter backdrop-blur transition-all"
>
  <div class="container navbar mx-auto">
    <!-- Open drawer icon -->
    <div class="block flex-1 lg:hidden">
      <label
        for="main-drawer"
        aria-label="open sidebar"
        class="btn btn-square btn-ghost"
      >
        <span class="i-mdi-menu h-8 w-8 text-primary" />
      </label>
    </div>

    <!-- Navbar content -->
    <div class="container hidden flex-1 lg:block">
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

    <div class="flex">
      <div class="hidden lg:flex">
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
        <div class="dropdown dropdown-end dropdown-hover">
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label tabindex="0" class="btn btn-ghost">
            <span class="i-mdi-account-circle text-2xl" />
          </label>
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <div
            tabindex="0"
            class="card dropdown-content card-compact z-[1] w-max bg-base-200 p-2 text-center text-base-content shadow"
          >
            <div class="card-body">
              <p class="text-center font-semibold">Inloggad som</p>
              <h3 class="text-xl font-bold">
                {getFullName($page.data.member)}
              </h3>
              <p class="text-sm">({$page.data.user?.studentId})</p>
              <span class="divider m-1" />

              <div class="flex flex-col items-start gap-2">
                <a
                  href={`/members/${$page.data.user?.studentId}`}
                  class="btn btn-ghost w-48 justify-start text-base-content"
                >
                  <span class="i-mdi-account-circle size-6 text-primary" />
                  Profil
                </a>
                <a href="/settings" class="btn btn-ghost w-48 justify-start">
                  <span class="i-mdi-cog size-6 text-primary" />
                  Inställningar
                </a>
              </div>
              <span class="divider m-1" />
              <button
                class="btn btn-ghost justify-start"
                on:click={() => signOut()}
              >
                <span class="i-mdi-logout size-6 text-primary" />
                Logga ut</button
              >
            </div>
          </div>
        </div>
      {:else}
        <button class="btn btn-ghost" on:click={() => signIn("keycloak")}>
          Logga in
        </button>
      {/if}
    </div>
  </div>
</div>
