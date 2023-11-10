<script lang="ts">
  import { signIn, signOut } from "@auth/sveltekit/client";
  import { page } from "$app/stores";
  import "../app.css";
  import apiNames from "$lib/utils/apiNames";
  export let accessPolicies: string[] = [];
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
    <div class="navbar bg-base-200 w-full">
      <div class="flex-none lg:hidden">
        <label for="my-drawer-3" aria-label="open sidebar" class="btn btn-square btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="inline-block h-6 w-6 stroke-current"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path></svg
          >
        </label>
      </div>
      <div class="hidden flex-none lg:block">
        <!-- Navbar menu content here -->
        <a class="btn" href="/">Hem</a>
        <a class="btn" href="/news">Nyheter</a>
        <a class="btn" href="/events">Evenemang</a>
        <a class="btn" href="/documents">Filer</a>
        <!-- https://bugs.webkit.org/show_bug.cgi?id=22261 -->
        <div class="dropdown dropdown-hover">
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label tabindex="0" class="btn">Sektionen</label>
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <ul
            tabindex="0"
            class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
          >
            <li><a href="/committees">Utskott</a></li>
          </ul>
        </div>
        {#if accessPolicies.includes(apiNames.ACCESS_POLICY.READ)}
          <!-- https://bugs.webkit.org/show_bug.cgi?id=22261 -->
          <div class="dropdown dropdown-hover">
            <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label tabindex="0" class="btn">Admin</label>
            <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
            <ul
              tabindex="0"
              class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
              <li><a href="/admin/access">Access</a></li>
            </ul>
          </div>
        {/if}
      </div>
      <div class="flex-1" />
      {#if $page.data.session}
        <button class="btn" on:click={() => signOut()}>Logga ut</button>
        <a href="/profile">Profil ({user?.student_id})</a>
      {:else}
        <button class="btn" on:click={() => signIn("keycloak")}>Logga in</button>
      {/if}
    </div>
    <!-- Page content here -->
    <slot />
  </div>
  <div class="drawer-side">
    <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"></label>
    <div class="menu bg-base-200 min-h-full w-80">
      <!-- Sidebar content here -->
      <div><a on:click={close} class="btn" href="/">Hem</a></div>
      <div><a on:click={close} class="btn" href="/news">Nyheter</a></div>
      <div><a on:click={close} class="btn" href="/events">Evenemang</a></div>
      <div><a on:click={close} class="btn" href="/documents">Filer</a></div>
      <!-- https://bugs.webkit.org/show_bug.cgi?id=22261 -->
      <div class="dropdown dropdown-hover">
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label tabindex="0" class="btn">Sektionen</label>
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <ul
          tabindex="0"
          class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
        >
          <li><a on:click={close} href="/committees">Utskott</a></li>
        </ul>
      </div>
      {#if accessPolicies.includes(apiNames.ACCESS_POLICY.READ)}
        <!-- https://bugs.webkit.org/show_bug.cgi?id=22261 -->
        <div class="dropdown dropdown-hover">
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label tabindex="0" class="btn" >Admin</label>
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <ul
            tabindex="0"
            class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
          >
            <li><a on:click={close} href="/admin/access">Access</a></li>
          </ul>
        </div>
      {/if}
    </div>
  </div>
</div>
