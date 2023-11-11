<script lang="ts">
  import { signIn, signOut } from "@auth/sveltekit/client";
  import { page } from "$app/stores";
  import "../app.css";
  import apiNames from "$lib/utils/apiNames";
  import DarkLightToggle from "./DarkLightToggle.svelte";
  import DsekLogo from "$lib/components/DsekLogo.svelte";
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
    <div class="navbar bg-base-200 w-full">
      <div class="block lg:hidden">
        <label for="my-drawer-3" aria-label="open sidebar" class="btn btn-square btn-ghost">
          <span class="i-mdi-menu h-10 w-10"> </span>
        </label>
      </div>
      <div class="hidden flex-none lg:block">
        <!-- Navbar menu content here -->
        <a class="btn btn-ghost" href="/"
          ><span
            class="i-mdi-home text-primary-focus h-6 w-6
          "
          ></span>Hem</a
        >
        <a class="btn btn-ghost" href="/news"
          ><span class="i-mdi-newspaper text-primary-focus h-6 w-6"></span> Nyheter</a
        >
        <a class="btn btn-ghost" href="/events"
          ><span class="i-mdi-calendar text-primary-focus h-6 w-6"></span>
          Evenemang</a
        >
        <a class="btn btn-ghost" href="/documents"
          ><span class="i-mdi-text-box-multiple text-primary-focus h-6 w-6"></span>
          Dokument</a
        >
        <!-- https://bugs.webkit.org/show_bug.cgi?id=22261 -->
        <div class="dropdown dropdown-hover">
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label tabindex="0" class="btn btn-ghost">
            <DsekLogo className="h-6 w-6 text-primary-focus" />
            Sektionen</label
          >
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <ul
            tabindex="0"
            class="menu dropdown-content rounded-box bg-base-100 z-[1] w-52 p-2 shadow"
          >
            <li>
              <a href="/committees" class="btn-ghost"
                ><span class="i-mdi-account-group text-primary-focus h-6 w-6"></span>
                Utskott</a
              >
            </li>
            <li>
              <a href="/songbook" class="btn-ghost">
                <span
                  class="i-mdi-library-music
                 text-primary-focus h-6 w-6"
                ></span>
                Sjungbok</a
              >
            </li>
          </ul>
        </div>
        {#if accessPolicies.includes(apiNames.ACCESS_POLICY.READ)}
          <!-- https://bugs.webkit.org/show_bug.cgi?id=22261 -->
          <div class="dropdown-hover dropdown">
            <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label tabindex="0" class="btn btn-ghost"
              ><span class="i-mdi-security text-primary-focus h-6 w-6"></span>
              Admin</label
            >
            <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
            <ul
              tabindex="0"
              class="menu dropdown-content rounded-box bg-base-100 z-[1] w-52 p-2 shadow"
            >
              <li>
                <a href="/admin/access" class="btn-ghost"
                  ><span class="i-mdi-key text-primary-focus h-6 w-6"> </span>
                  Access</a
                >
              </li>
            </ul>
          </div>
        {/if}
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
    <div class="menu bg-base-200 min-h-full w-80">
      <!-- Sidebar content here -->
      <ul class="menu bg-base-200 rounded-box w-56">
        <li>
          <a on:click={close} href="/" class="btn justify-start content-center">
            <span class="i-mdi-home text-primary-focus h-6 w-6" />
            Hem
          </a>
        </li>
        <li>
          <a on:click={close} href="/news" class="btn justify-start content-center">
            <span class="i-mdi-newspaper text-primary-focus h-6 w-6" />
            Nyheter
          </a>
        </li>
        <li>
          <a on:click={close} href="/events" class="btn justify-start content-center">
            <span class="i-mdi-calendar text-primary-focus h-6 w-6" />
            Evenemang
          </a>
        </li>
        <li>
          <a on:click={close} href="/documents" class="btn justify-start content-center">
            <span class="i-mdi-text-box-multiple text-primary-focus h-6 w-6" />
            Dokument
          </a>
        </li>
        <li>
          <span class="btn justify-start content-center"><DsekLogo className="h-6 w-6 text-primary-focus" />Sektionen</span>
          <ul>
            <li>
              <a on:click={close} href="/committees" class="btn justify-start content-center">
                <span class="i-mdi-account-group text-primary-focus h-6 w-6" />
                Utskott
              </a>
            </li>
            <li>
              <a on:click={close} href="/songbook" class="btn justify-start content-center">
                <span class="i-mdi-library-music text-primary-focus h-6 w-6" />
                Sjungbok
              </a>
            </li>
          </ul>
        </li>
        {#if accessPolicies.includes(apiNames.ACCESS_POLICY.READ)}
          <li>
            <span class="btn justify-start content-center">
              <span class="i-mdi-security text-primary-focus h-6 w-6" />
              Admin
            </span>
            <ul>
              <li>
                <a on:click={close} href="/admin/access" class="btn justify-start content-center">
                  <span class="i-mdi-key text-primary-focus h-6 w-6" />
                  Access
                </a>
              </li>
            </ul>
          </li>
        {/if}
      </ul>
    </div>
  </div>
</div>
