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
      <div class="flex-1"></div>
      <ul class="space-x-2">
        <!-- Navbar menu content here -->
        <li><a class="btn btn-ghost hidden lg:inline-flex" href="/">D-sektionen</a></li>
        <li><a class="btn btn-ghost hidden lg:inline-flex" href="/news">Nyheter</a></li>
        <li><a class="btn btn-ghost hidden lg:inline-flex" href="/events">Evenemang</a></li>
        <li><a class="btn btn-ghost hidden lg:inline-flex" href="/documents">Filer</a></li>
        <li class="dropdown-hover dropdown group">
          <span class="btn btn-ghost hidden lg:inline-flex">Sektionen</span>
          <ul
            class="menu dropdown-content rounded-box bg-base-100 text-base-content pointer-events-none !visible z-10 w-52 -translate-y-3 p-2 opacity-0 shadow-lg shadow-black/30 group-hover:pointer-events-auto group-hover:translate-y-0"
          >
            <li><a href="/committees">Utskott</a></li>
          </ul>
        </li>
        {#if accessPolicies.includes(apiNames.ACCESS_POLICY.READ)}
          <li class="dropdown-hover dropdown group">
            <span class="btn btn-ghost hidden lg:inline-flex">Admin</span>
            <ul
              class="menu dropdown-content rounded-box bg-base-100 text-base-content pointer-events-none !visible z-10 w-52 -translate-y-3 p-2 opacity-0 shadow-lg shadow-black/30 group-hover:pointer-events-auto group-hover:translate-y-0"
            >
              <li><a href="/admin/access">Access</a></li>
            </ul>
          </li>
        {/if}
        {#if $page.data.session}
          <li><button class="btn btn-ghost" on:click={() => signOut()}>Logga ut</button></li>
          <li><a class="btn btn-ghost" href="/profile"> Profil ({user?.student_id})</a></li>
        {:else}
          <li>
            <button class="btn btn-ghost" on:click={() => signIn("keycloak")}>Logga in</button>
          </li>
        {/if}
      </ul>
    </div>
    <!-- Page content here -->
  </div>
  <div class="drawer-side z-10">
    <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"></label>
    <ul class="bg-base-200 flex min-h-full w-80 flex-col p-2">
      <!-- Sidebar content here -->
      <li><a on:click={close} class="btn btn-ghost flex-1" href="/">D-sektionen</a></li>
      <li><a on:click={close} class="btn btn-ghost flex-1" href="/news">Nyheter</a></li>
      <li><a on:click={close} class="btn btn-ghost flex-1" href="/events">Evenemang</a></li>
      <li><a on:click={close} class="btn btn-ghost flex-1" href="/documents">Filer</a></li>
      <li class="dropdown-hover dropdown group">
        <span class="btn btn-ghost flex-1">Sektionen</span>
        <ul
          class="menu dropdown-content rounded-box bg-base-100 text-base-content pointer-events-none !visible z-10 w-52 -translate-y-3 p-2 opacity-0 shadow-lg shadow-black/30 group-hover:pointer-events-auto group-hover:translate-y-0"
        >
          <li><a on:click={close} href="/committees">Utskott</a></li>
        </ul>
      </li>
      {#if accessPolicies.includes(apiNames.ACCESS_POLICY.READ)}
        <li class="dropdown-hover dropdown group">
          <span class="btn btn-ghost flex-1">Admin</span>
          <ul
            class="menu dropdown-content rounded-box bg-base-100 text-base-content pointer-events-none !visible z-10 w-52 -translate-y-3 p-2 opacity-0 shadow-lg shadow-black/30 group-hover:pointer-events-auto group-hover:translate-y-0"
          >
            <li><a on:click={close} href="/admin/access">Access</a></li>
          </ul>
        </li>
      {/if}
    </ul>
  </div>
</div>
