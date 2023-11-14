<script lang="ts">
  import { signIn, signOut } from "@auth/sveltekit/client";
  import { page } from "$app/stores";
  import "../app.css";
  import DarkLightToggle from "./DarkLightToggle.svelte";
  import DsekLogo from "$lib/components/DsekLogo.svelte";
  import { routes } from "./routes";
  $: accessPolicies = $page.data.accessPolicies;
  $: user = $page.data.session?.user;

  let checked = false;
  function close() {
    checked = !checked;
  }
</script>

<div class="drawer">
  <input id="my-drawer-3" type="checkbox" class="drawer-toggle" bind:checked />
  <div class="drawer-content flex flex-col">
    <!-- Navbar -->
    <div class="navbar w-full bg-base-200">
      <div class="block lg:hidden">
        <label for="my-drawer-3" aria-label="open sidebar" class="btn btn-square btn-ghost">
          <span class="i-mdi-menu h-10 w-10"> </span>
        </label>
      </div>
      <div class="hidden flex-none lg:block">
        <!-- Navbar menu content here -->
        {#each routes as route (route.title)}
          {#if !route.accessRequired || accessPolicies.includes(route.accessRequired)}
            {#if route?.children?.length}
              <div class="dropdown dropdown-hover">
                <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label tabindex="0" class="btn btn-ghost">
                  {#if route.isDsekIcon}
                    <DsekLogo className="h-6 w-6 text-primary-focus" />
                  {:else}
                    <span class={`${route.icon} h-6 w-6 text-primary-focus`} />
                  {/if}
                  {route.title}</label
                >
                <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                <ul
                  tabindex="0"
                  class="menu dropdown-content rounded-box z-[1] w-52 bg-base-100 p-2 shadow"
                >
                  {#each route.children as child (child.title)}
                    <li>
                      <a href={child.path} class="btn-ghost">
                        <span class={`${child.icon} h-6 w-6 text-primary-focus`} />
                        {child.title}</a
                      >
                    </li>
                  {/each}
                </ul>
              </div>
            {:else}
              <a class="btn btn-ghost" href={route.path}>
                {#if route.isDsekIcon}
                  <DsekLogo className="h-6 w-6 text-primary-focus" />
                {:else}
                  <span class={`${route.icon} h-6 w-6 text-primary-focus`} />
                {/if}
                {route.title}
              </a>
            {/if}
          {/if}
        {/each}
      </div>
      <div class="flex-1" />
      <DarkLightToggle />
      {#if $page.data.session}
        <button class="btn btn-ghost" on:click={() => signOut()}
          ><span class="i-mdi-logout h-6 w-6"> </span>
          Logga ut</button
        >
        <a href={`/members/${user?.student_id}`} class="btn btn-ghost">
          <span class="i-mdi-account-circle h-6 w-6"> </span>
          Profil ({user?.student_id})</a
        >
      {:else}
        <button class="btn btn-ghost" on:click={() => signIn("keycloak")}>Logga in</button>
      {/if}
    </div>
    <!-- Page content here -->
    <slot />
  </div>
  <div class="drawer-side">
    <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"></label>
    <div class="menu min-h-full w-80 bg-base-200">
      <!-- Sidebar content here -->
      <ul class="menu rounded-box w-56 bg-base-200">
        {#each routes as route (route.title)}
          {#if !route.accessRequired || accessPolicies.includes(route.accessRequired)}
            {#if route?.children?.length}
              <li>
                <span class="btn content-center justify-start">
                  {#if route.isDsekIcon}
                    <DsekLogo className="h-6 w-6 text-primary-focus" />
                  {:else}
                    <span class={`${route.icon} h-6 w-6 text-primary-focus`} />
                  {/if}
                  {route.title}</span
                >
                <ul>
                  {#each route.children as child (child.title)}
                    <li>
                      <a
                        on:click={close}
                        href={child.path}
                        class="btn content-center justify-start"
                      >
                        <span class={`${child.icon} h-6 w-6 text-primary-focus`} />
                        {child.title}
                      </a>
                    </li>
                  {/each}
                </ul>
              </li>
            {:else}
              <li>
                <a on:click={close} href="/" class="btn content-center justify-start">
                  {#if route.isDsekIcon}
                    <DsekLogo className="h-6 w-6 text-primary-focus" />
                  {:else}
                    <span class={`${route.icon} h-6 w-6 text-primary-focus`} />
                  {/if}
                  {route.title}
                </a>
              </li>
            {/if}
          {/if}
        {/each}
      </ul>
    </div>
  </div>
</div>
