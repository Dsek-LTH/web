<script lang="ts">
  import { signIn, signOut } from "@auth/sveltekit/client";
  import { page } from "$app/stores";
  $: user = $page.data.session?.user;
  import "../app.css";
  import apiNames from "$lib/apiNames";
  export let data;
</script>

<nav class="navbar sticky top-0 z-50 h-20 bg-primary text-primary-content shadow-xl">
  <div class="layout-container w-full">
    <div class="flex-1">
      <a class="btn btn-ghost text-xl normal-case" href="/">D-sektionen</a>
      <a class="btn btn-ghost" href="/news">Nyheter</a>
      <a class="btn btn-ghost" href="/events">Evenemang</a>
      {#if data.accessPolicies.includes(apiNames.ACCESS_POLICY.READ)}
        <div class="dropdown-hover dropdown">
          <span class="btn btn-ghost">Admin</span>
          <ul
            class="dropdown-content menu rounded-box z-[1] w-52 bg-base-100 p-2 text-base-content shadow"
          >
            <li><a href="/admin/access">Access</a></li>
          </ul>
        </div>
      {/if}
    </div>
    <div class="flex-none">
      {#if $page.data.session}
        <button class="btn btn-neutral" on:click={() => signOut()}> Logga ut </button>
        <a class="btn btn-ghost" href="/profile"> Profil ({user?.student_id}) </a>
      {:else}
        <button class="btn btn-neutral" on:click={() => signIn("keycloak")}> Logga in </button>
      {/if}
    </div>
  </div>
</nav>

<div
  class="h-[calc(100vh-9rem)] flex-col overflow-auto pb-8 accent-primary md:h-[calc(100vh-5rem)] [&>*]:flex-1"
>
  <slot />
</div>

<div class="btm-nav bg-base-200 md:hidden">
  <button class="text-primary">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      ><path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      /></svg
    >
  </button>
  <button class="active bg-base-200 text-primary">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      ><path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      /></svg
    >
  </button>
  <button class="text-primary">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      ><path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      /></svg
    >
  </button>
</div>

<style>
  .dropdown:is(:not(details)) .dropdown-content {
    visibility: visible;
    pointer-events: none;
    transform: translateY(-0.75rem);
    opacity: 0;
  }

  /* .dropdown.dropdown-open .dropdown-content, */
  .dropdown:not(.dropdown-hover):focus .dropdown-content,
  .dropdown:focus-within .dropdown-content {
    pointer-events: initial;
    transform: translateY(0);
    opacity: 1;
  }
  @media (hover: hover) {
    .dropdown.dropdown-hover:hover .dropdown-content {
      pointer-events: initial;
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
