<script lang="ts">
  import { page } from "$app/stores";
  import { signIn, signOut } from "@auth/sveltekit/client";
  import DarkLightToggle from "./DarkLightToggle.svelte";
  import DsekLogo from "./DsekLogo.svelte";
  import LanguageSwitcher from "./LanguageSwitcher.svelte";
  import { routes } from "./routes";
  import { isAuthorized } from "$lib/utils/authorization";
  import { getFullName } from "$lib/utils/client/member";
  import Notification from "./NotificationBell.svelte";
  export let notifications: {
    id: number;
    title: string;
    message: string;
    type: string;
    link: string;
    readAt: Date | null;
    memberId: string;
    createdAt: Date;
    updatedAt: Date;
    fromAuthorId: string | null;
  }[];
</script>

<div
  class="navbar sticky top-0 z-10 bg-base-200 bg-opacity-60 filter backdrop-blur transition-all"
>
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
  <div class="hidden flex-1 lg:block">
    {#each routes as route (route.title)}
      {#if !route.accessRequired || isAuthorized(route.accessRequired, $page.data.user)}
        {#if route?.children?.length}
          <div class="dropdown dropdown-hover">
            <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label tabindex="0" class="btn btn-ghost">
              {#if route.isDsekIcon}
                <DsekLogo className="h-6 w-6 text-primary" />
              {:else}
                <span class={`${route.icon} h-6 w-6 text-primary`} />
              {/if}
              {route.title}</label
            >
            <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
            <ul
              tabindex="0"
              class="menu dropdown-content z-[1] w-52 rounded-box bg-base-100 p-2 shadow"
            >
              {#each route.children as child (child.title)}
                {#if !child.accessRequired || isAuthorized(child.accessRequired, $page.data.user)}
                  <li>
                    <a
                      href={child.path}
                      class="btn-ghost active:!bg-primary/10"
                    >
                      <span class={`${child.icon} h-6 w-6 text-primary`} />
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
              <DsekLogo className="h-6 w-6 text-primary" />
            {:else}
              <span class={`${route.icon} h-6 w-6 text-primary`} />
            {/if}
            {route.title}
          </a>
        {/if}
      {/if}
    {/each}
  </div>

  <div class="flex">
    <LanguageSwitcher />
    <DarkLightToggle />
    {#if $page.data.user && $page.data.member}
      <Notification {notifications} />
      <div class="dropdown dropdown-end dropdown-hover">
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label tabindex="0" class="btn btn-ghost">
          <span class="i-mdi-account-circle text-2xl" />
        </label>
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <div
          tabindex="0"
          class="card dropdown-content card-compact z-[1] w-max bg-base-100 p-2 text-center text-base-content shadow"
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
                <span class="i-mdi-account-circle h-6 w-6 text-primary" />
                Profil
              </a>
              <a href="/settings" class="btn btn-ghost w-48 justify-start">
                <span class="i-mdi-cog h-6 w-6 text-primary" />
                Inställningar
              </a>
            </div>
            <span class="divider m-1" />
            <button
              class="btn btn-ghost justify-start"
              on:click={() => signOut()}
            >
              <span class="i-mdi-logout h-6 w-6 text-primary" />
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
