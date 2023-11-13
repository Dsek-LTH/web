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
  let y: number;
  $: top = y == 0;
</script>

<svelte:window bind:scrollY={y} />

<div class="drawer">
  <input id="my-drawer-3" type="checkbox" class="drawer-toggle" bind:checked />
  <div class="drawer-content flex flex-col">
    <!-- Navbar -->
    <div
      class="glass navbar fixed z-20 w-full transition-all"
      class:glass-fill={top}
      class:glass={!top}
    >
      <div class="block lg:hidden">
        <label for="my-drawer-3" aria-label="open sidebar" class="btn btn-square btn-ghost">
          <span
            class="i-mdi-menu h-10 w-10 bg-primary
          "
          >
          </span>
        </label>
      </div>
      <div class="hidden flex-none lg:block">
        <!-- Navbar menu content here -->
        <a class="btn btn-ghost" href="/"
          ><span
            class="i-mdi-home h-6 w-6 bg-primary
          "
          ></span>Hem</a
        >
        <a class="btn btn-ghost" href="/news"
          ><span class="i-mdi-newspaper h-6 w-6 bg-primary"></span> Nyheter</a
        >
        <a class="btn btn-ghost" href="/events"
          ><span class="i-mdi-calendar h-6 w-6 bg-primary"></span>
          Evenemang</a
        >
        <a class="btn btn-ghost" href="/documents"
          ><span class="i-mdi-text-box-multiple h-6 w-6 bg-primary"></span>
          Dokument</a
        >
        <!-- https://bugs.webkit.org/show_bug.cgi?id=22261 -->
        <div class="dropdown dropdown-hover">
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label tabindex="0" class="btn btn-ghost">
            <DsekLogo className="h-6 w-6 text-primary" />
            Sektionen</label
          >
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <ul
            tabindex="0"
            class="menu dropdown-content rounded-box z-[1] w-52 bg-base-100 p-2 shadow"
          >
            <li>
              <a href="/committees" class="btn-ghost"
                ><span class="i-mdi-account-group h-6 w-6 bg-primary"></span>
                Utskott</a
              >
            </li>
            <li>
              <a href="/songbook" class="btn-ghost">
                <span
                  class="i-mdi-library-music
                 h-6 w-6 bg-primary"
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
              ><span class="i-mdi-security h-6 w-6 bg-primary"></span>
              Admin</label
            >
            <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
            <ul
              tabindex="0"
              class="menu dropdown-content rounded-box z-[1] w-52 bg-base-100 p-2 shadow"
            >
              <li>
                <a href="/admin/access" class="btn-ghost"
                  ><span class="i-mdi-key h-6 w-6 bg-primary"> </span>
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
        <div class="dropdown-hover dropdown dropdown-end">
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label tabindex="0" class="btn btn-ghost m-1"
            ><span class="i-mdi-account-circle h-10 w-10"> </span></label
          >
          <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
          <div
            tabindex="0"
            class="card dropdown-content card-compact z-[1] w-max bg-base-100 p-2 text-center text-base-content shadow"
          >
            <div class="card-body">
              <p class="text-center font-semibold">Inloggad som</p>
              <h3 class="text-xl font-bold">
                {user?.name}
              </h3>
              <p class="text-sm">({user?.student_id})</p>
              <span class="divider m-1"></span>

              <div class="flex flex-col items-start gap-2">
                <a
                  href={`/members/${user?.student_id}`}
                  class="btn btn-ghost w-48 justify-start text-base-content"
                >
                  <span class="i-mdi-account-circle h-6 w-6 bg-primary"> </span>
                  Profil</a
                >
                <a href="/settings" class="btn btn-ghost w-48 justify-start">
                  <span class="i-mdi-cog h-6 w-6 bg-primary"> </span>
                  Inställningar</a
                >
              </div>
              <span class="divider m-1"></span>
              <button class="btn btn-ghost justify-start" on:click={() => signOut()}>
                <span class="i-mdi-logout h-6 w-6 bg-primary"> </span>
                Logga ut</button
              >
            </div>
          </div>
        </div>
      {:else}
        <button class="btn btn-ghost" on:click={() => signIn("keycloak")}>Logga in</button>
      {/if}
    </div>
    <!-- Page content here -->
    <slot />
  </div>
  <div class="drawer-side z-30">
    <label
      for="my-drawer-3"
      aria-label="close sidebar"
      class="drawer-overlay
    "
    ></label>
    <div class="menu min-h-full w-80 bg-base-200">
      <!-- Sidebar content here -->
      <ul class="menu rounded-box w-56 bg-base-200">
        <li>
          <a on:click={close} href="/" class="btn content-center justify-start">
            <span class="i-mdi-home h-6 w-6 bg-primary" />
            Hem
          </a>
        </li>
        <li>
          <a on:click={close} href="/news" class="btn content-center justify-start">
            <span class="i-mdi-newspaper h-6 w-6 bg-primary" />
            Nyheter
          </a>
        </li>
        <li>
          <a on:click={close} href="/events" class="btn content-center justify-start">
            <span class="i-mdi-calendar h-6 w-6 bg-primary" />
            Evenemang
          </a>
        </li>
        <li>
          <a on:click={close} href="/documents" class="btn content-center justify-start">
            <span class="i-mdi-text-box-multiple h-6 w-6 bg-primary" />
            Dokument
          </a>
        </li>
        <li>
          <span class="btn content-center justify-start"
            ><DsekLogo className="h-6 w-6 text-primary" />Sektionen</span
          >
          <ul>
            <li>
              <a on:click={close} href="/committees" class="btn content-center justify-start">
                <span class="i-mdi-account-group h-6 w-6 bg-primary" />
                Utskott
              </a>
            </li>
            <li>
              <a on:click={close} href="/songbook" class="btn content-center justify-start">
                <span class="i-mdi-library-music h-6 w-6 bg-primary" />
                Sjungbok
              </a>
            </li>
          </ul>
        </li>
        {#if accessPolicies.includes(apiNames.ACCESS_POLICY.READ)}
          <li>
            <span class="btn content-center justify-start">
              <span class="i-mdi-security h-6 w-6 bg-primary" />
              Admin
            </span>
            <ul>
              <li>
                <a on:click={close} href="/admin/access" class="btn content-center justify-start">
                  <span class="i-mdi-key h-6 w-6 bg-primary" />
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

<style>
  :global(.glass) {
    background: hsl(var(--b2) / 0.6);
    /* box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); */
    backdrop-filter: blur(10.5px);
    -webkit-backdrop-filter: blur(10.5px);
  }
  .glass-fill {
    background: hsl(var(--b2) / 0.9);
  }
</style>
