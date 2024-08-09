<script lang="ts">
  import NavigationLoader from "$lib/components/utils/NavigationLoader.svelte";
  import { fade } from "svelte/transition";

  import AppNotificationHandler from "$lib/components/utils/AppNotificationHandler.svelte";
  import { languageTag } from "$paraglide/runtime";
  import dayjs from "dayjs";
  import "dayjs/locale/sv";
  import Toast from "../../Toast.svelte";
  import "@fontsource/lexend";
  import lexend400 from "@fontsource/lexend/files/lexend-latin-400-normal.woff2?url";
  import lexend500 from "@fontsource/lexend/files/lexend-latin-500-normal.woff2?url";
  // import { onMount } from "svelte";
  import PostRevealBottomNav from "./PostRevealBottomNav.svelte";
  import PostRevealHeader from "./PostRevealHeader.svelte";
  import "./postReveal.css";

  export let data;

  $: (() => {
    const locale = languageTag();
    dayjs.locale(locale);
  })();

  // let mounted = false;

  // onMount(() => {
  //   mounted = true;
  // });
</script>

<svelte:head>
  <link
    rel="preload"
    as="font"
    type="font/woff2"
    href={lexend400}
    crossorigin="anonymous"
  />
  <link
    rel="preload"
    as="font"
    type="font/woff2"
    href={lexend500}
    crossorigin="anonymous"
  />
</svelte:head>

<div class="post-reveal h-dvh" data-theme="nollningPostReveal">
  <!-- {#if mounted} -->
  <div in:fade={{ duration: 1000 }} class="flex h-full flex-col">
    {#if !data.isApp}
      <nav class="contents">
        <!-- <Navbar /> -->
        <!-- <Drawer /> -->
      </nav>
    {:else}
      <AppNotificationHandler />
      <PostRevealHeader />
    {/if}

    <main class="relative flex-1 overflow-y-auto">
      <!-- so absolute positioning is outside padding -->
      <div class="px-10 py-6">
        <slot />
      </div>
    </main>
    <Toast />
    {#if !data.isApp}
      <!-- <Footer /> -->
    {:else}
      <PostRevealBottomNav />

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

    <NavigationLoader>
      <img
        class="size-40 animate-spin"
        alt="Loading spinner"
        src="https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/nollu/SVG/full/dark.svg"
      />
    </NavigationLoader>
  </div>
  <!-- {/if} -->
</div>
