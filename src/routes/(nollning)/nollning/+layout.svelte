<script lang="ts">
  import { languageTag } from "$paraglide/runtime";
  import dayjs from "dayjs";
  import "dayjs/locale/sv";
  import AppNotificationHandler from "../../(app)/AppNotificationHandler.svelte";
  import Toast from "../../Toast.svelte";
  // import Footer from "../Footer.svelte";
  // import Navbar from "../Navbar.svelte";
  import AppBottomNav from "./AppBottomNav.svelte";
  import AppHeader from "./AppHeader.svelte";
  import "./postReveal.css";

  export let data;
  $: (() => {
    const locale = languageTag();
    dayjs.locale(locale);
  })();
</script>

<div data-theme="nollningPostReveal" class="post-reveal flex-1">
  <slot />
</div>
{#if !data.isApp}
  <nav class="contents">
    <!-- <Navbar /> -->
    <!-- <Drawer /> -->
  </nav>
{:else}
  <AppNotificationHandler />
  <AppHeader />
{/if}

<main class="flex-1" class:pb-16={data.isApp}>
  <slot />
</main>
<Toast />
{#if !data.isApp}
  <!-- <Footer /> -->
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
