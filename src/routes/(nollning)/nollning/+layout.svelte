<script lang="ts">
  import NavigationLoader from "$lib/components/utils/NavigationLoader.svelte";
  import eye from "./(photos)/eye.svg";
  import favicon from "./(photos)/favicon.png";
  import swirl from "./(photos)/swirl.svg";

  import AppNotificationTokenHandler from "$lib/components/utils/AppNotificationTokenHandler.svelte";
  import AppUnreadNotificationHandler from "$lib/components/utils/AppUnreadNotificationHandler.svelte";
  import { languageTag } from "$paraglide/runtime";
  import "@fontsource/lexend";
  import lexend400 from "@fontsource/lexend/files/lexend-latin-400-normal.woff2?url";
  import lexend500 from "@fontsource/lexend/files/lexend-latin-500-normal.woff2?url";
  import dayjs from "dayjs";
  import "dayjs/locale/sv";
  import Toast from "../../Toast.svelte";
  import PostRevealBottomNav from "./PostRevealBottomNav.svelte";
  import PostRevealDesktopNavbar from "./PostRevealDesktopNavbar.svelte";
  import PostRevealHeader from "./PostRevealHeader.svelte";
  import "./postReveal.css";

  export let data;

  $: (() => {
    const locale = languageTag();
    dayjs.locale(locale);
  })();
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
  {#if data.revealTheme}
    <link rel="icon" href={favicon} />
  {/if}
</svelte:head>

<div
  class="post-reveal h-dvh"
  data-theme={data.revealTheme ? "nollningPostReveal" : "nollningPreReveal"}
>
  <div class="flex h-full flex-col">
    {#if !data.isApp}
      <PostRevealDesktopNavbar>
        <slot />
      </PostRevealDesktopNavbar>
    {:else}
      {#await data.notifications then notifications}
        <AppUnreadNotificationHandler
          notificationCount={notifications?.length}
        />
      {/await}
      <AppNotificationTokenHandler />
      <PostRevealHeader />

      <main
        class="scrollbar-hide *:scrollbar-hide relative flex-1 scroll-mt-10 overflow-y-auto"
        class:scrollbar-hide={data.isApp}
      >
        <!-- so absolute positioning is outside padding -->
        <div class="scrollbar-hide px-6 py-6">
          <slot />
        </div>
      </main>
    {/if}

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
  </div>
  <NavigationLoader>
    {#if data.revealTheme}
      <div class="relative size-60 md:size-80">
        <img
          src={swirl}
          class="absolute inset-0 animate-[reverse-spin_2s_linear_infinite]"
          alt="Nollning logo spinning"
        />
        <img
          src={eye}
          class="absolute inset-0"
          alt="Nollning logo non-spinning"
        />
      </div>
    {:else}
      <img
        class="size-40 animate-spin md:size-80"
        alt="Loading spinner"
        src="https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/nollu/SVG/full/dark.svg"
      />
    {/if}
  </NavigationLoader>
</div>
