<script lang="ts">
  import { env } from "$env/dynamic/public";
  import GlobalAlert from "$lib/components/GlobalAlert.svelte";
  import AppNotificationTokenHandler from "$lib/components/utils/AppNotificationTokenHandler.svelte";
  import AppUnreadNotificationHandler from "$lib/components/utils/AppUnreadNotificationHandler.svelte";
  import { languageTag } from "$paraglide/runtime";
  import "dayjs/locale/sv";
  import AppBottomNav from "../AppBottomNav.svelte";
  import AppHeader from "../AppHeader.svelte";
  import Drawer from "../Drawer.svelte";
  import Footer from "../Footer.svelte";
  import Navbar from "../Navbar.svelte";
  import Toast from "../Toast.svelte";

  export let data;
</script>

<svelte:head>
  <script
    defer
    src={env.PUBLIC_UMAMI_SRC}
    data-website-id={env.PUBLIC_UMAMI_WEBSITE_ID}
  ></script>
</svelte:head>

{#if !data.isApp}
  <nav class="contents">
    <Navbar />
    <Drawer />
  </nav>
{:else}
  {#await data.notificationsPromise then notifications}
    <AppUnreadNotificationHandler
      notificationCount={notifications?.filter((n) => !n.readAt).length}
    />
  {/await}
  <AppNotificationTokenHandler />
  <AppHeader />
{/if}

{#each data.alerts as alert}
  <GlobalAlert
    message={languageTag() === "sv" ? alert.message : alert.messageEn}
    severity={alert.severity}
  />
{/each}

<main class="w-full flex-1 overflow-x-auto" class:pb-16={data.isApp}>
  <slot />
</main>
<Toast />
{#if !data.isApp}
  <Footer {data} />
{:else}
  <AppBottomNav />

  <style>
    /* hide scrollbar everywhere. It's usually not present in apps*/

    * {
      scrollbar-width: none;
    }

    *::-webkit-scrollbar {
      display: none; /* Safari and Chrome */
    }
  </style>
{/if}
