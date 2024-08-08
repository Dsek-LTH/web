<script lang="ts">
  import { languageTag } from "$paraglide/runtime";
  import dayjs from "dayjs";
  import "dayjs/locale/sv";
  import AppNotificationHandler from "$lib/components/utils/AppNotificationHandler.svelte";
  import Toast from "../../Toast.svelte";
  // import Footer from "../Footer.svelte";
  // import Navbar from "../Navbar.svelte";
  import PostRevealBottomNav from "./PostRevealBottomNav.svelte";
  import PostRevealHeader from "./PostRevealHeader.svelte";
  import "./postReveal.css";

  export let data;

  $: (() => {
    const locale = languageTag();
    dayjs.locale(locale);
  })();
</script>

<div
  class="post-reveal flex h-dvh flex-grow flex-col"
  data-theme="nollningPostReveal"
>
  {#if !data.isApp}
    <nav class="contents">
      <!-- <Navbar /> -->
      <!-- <Drawer /> -->
    </nav>
  {:else}
    <AppNotificationHandler />
    <PostRevealHeader />
  {/if}

  <main class="max-h-[calc(100dvh-128px)] flex-1 overflow-y-auto px-10 py-6">
    <slot />
  </main>
  <Toast />
  {#if !data.isApp}
    <!-- <Footer /> -->
  {:else}
    <PostRevealBottomNav />

    <style>
      /* hide scrollbar everywhere. It's usually not present in apps*/

      * {
        /* scrollbar-width: none; */
      }

      *::-webkit-scrollbar {
        display: none; /* Safari and Chrome */
      }
    </style>
  {/if}
</div>
