<script lang="ts">
  import GlobalAlert from "$lib/components/GlobalAlert.svelte";
  import { languageTag } from "$paraglide/runtime";
  import Drawer from "../Drawer.svelte";
  import Footer from "../Footer.svelte";
  import Navbar from "../Navbar.svelte";
  import Toast from "../Toast.svelte";
  import dayjs from "dayjs";
  import "dayjs/locale/sv";
  import AppHeader from "../AppHeader.svelte";
  import AppBottomNav from "../AppBottomNav.svelte";

  $: (() => {
    const locale = languageTag();
    dayjs.locale(locale);
  })();

  export let data;
</script>

{#if !data.isApp}
  <nav class="contents">
    <Navbar />
    <Drawer />
  </nav>
{:else}
  <AppHeader />
{/if}

{#each data.alerts as alert}
  <GlobalAlert
    message={languageTag() === "sv" ? alert.message : alert.messageEn}
    severity={alert.severity}
  />
{/each}

<main class="flex-1" class:pb-16={data.isApp}>
  <slot />
</main>
<Toast />
{#if !data.isApp}
  <Footer />
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
