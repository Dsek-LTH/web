<script lang="ts">
  import { signIn, signOut } from "@auth/sveltekit/client";
  import { page } from "$app/stores";
  import "../app.css";
  import apiNames from "$lib/utils/apiNames";
  export let accessPolicies: string[] = [];
  $: user = $page.data.session?.user;
</script>

<nav class="navbar sticky top-0 z-50 h-20 bg-primary text-primary-content shadow-xl">
  <div class="layout-container w-full">
    <div class="flex-1">
      <a class="btn btn-ghost text-xl normal-case" href="/">D-sektionen</a>
      <a class="btn btn-ghost" href="/news">Nyheter</a>
      <a class="btn btn-ghost" href="/events">Evenemang</a>
      <a class="btn btn-ghost" href="/documents">Filer</a>
      <div class="group dropdown dropdown-hover">
        <span class="btn btn-ghost">Sektionen</span>
        <ul
          class="menu dropdown-content rounded-box pointer-events-none !visible z-10 w-52 -translate-y-3 bg-base-100 p-2 text-base-content opacity-0 shadow-lg shadow-black/30 group-hover:pointer-events-auto group-hover:translate-y-0"
        >
          <li><a href="/committees">Utskott</a></li>
        </ul>
      </div>
      {#if accessPolicies.includes(apiNames.ACCESS_POLICY.READ)}
        <div class="dropdown-hover group dropdown">
          <span class="btn btn-ghost">Admin</span>
          <ul
            class="menu dropdown-content rounded-box pointer-events-none !visible z-10 w-52 -translate-y-3 bg-base-100 p-2 text-base-content opacity-0 shadow-lg shadow-black/30 group-hover:pointer-events-auto group-hover:translate-y-0"
          >
            <li><a href="/admin/access">Access</a></li>
          </ul>
        </div>
      {/if}
    </div>
    <div class="flex-none">
      {#if $page.data.session}
        <button class="btn btn-neutral" on:click={() => signOut()}> Logga ut </button>
        {#if user?.student_id}
          <a class="btn btn-ghost" href="/member/{user.student_id}">
            Profil ({user?.student_id})
          </a>
        {/if}
      {:else}
        <button class="btn btn-neutral" on:click={() => signIn("keycloak")}> Logga in </button>
      {/if}
    </div>
  </div>
</nav>
