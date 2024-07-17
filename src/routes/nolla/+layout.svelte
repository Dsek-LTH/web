<script lang="ts">
  import { languageTag } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { i18n } from "$lib/utils/i18n";
  import { invalidateAll } from "$app/navigation";
  import * as m from "$paraglide/messages";
  import "./styles.css";

  let checked = false;

  const routes = [
    { text: m.nolla_nav_start(), link: "/nolla" },
    { text: m.nolla_nav_nollning(), link: "/nolla/nollning" },
    { text: m.nolla_nav_sektionen(), link: "/nolla/sektionen" },
    { text: m.nolla_nav_todo(), link: "/nolla/todo" },
  ];
</script>

<div class="drawer flex-1 font-nolla-sans" data-theme="nollningPreReveal">
  <input id="my-drawer-3" type="checkbox" class="drawer-toggle" bind:checked />
  <div class="drawer-content flex flex-col">
    <!-- Navbar -->
    <div class="container navbar mx-auto w-full p-6 lg:py-12">
      <div class="flex-none lg:hidden">
        <label
          for="my-drawer-3"
          aria-label="open sidebar"
          class="btn btn-square btn-ghost"
        >
          <span class="i-mdi-menu h-8 w-8" />
        </label>
      </div>
      <ul
        class="hidden w-full gap-24 text-2xl font-semibold *:bg-gradient-to-r *:from-primary *:to-primary *:bg-[length:0_2px] *:bg-bottom *:bg-no-repeat *:transition-all lg:flex"
      >
        {#each routes as route}
          <li class="hover:bg-[length:100%_2px]">
            <a href={route.link}>{route.text}</a>
          </li>
        {/each}
      </ul>
      <a
        class="btn-pop-out ml-auto aspect-square bg-primary"
        href={i18n.route($page.url.pathname)}
        hreflang={languageTag() === "sv" ? "en" : "sv"}
        on:click={() => invalidateAll()}
      >
        <span
          class={`i-flag-${languageTag() === "sv" ? "se" : "gb"}-4x3 h-8 w-8`}
        />
      </a>
      <a href="/" class="btn-pop-out ml-4 mr-1 bg-primary">
        dsek.se
        <span class="i-mdi-arrow-right ml-2 h-8 w-8" />
      </a>
    </div>
    <div class="container mx-auto">
      <slot />
    </div>
  </div>
  <div class="drawer-side">
    <label
      for="my-drawer-3"
      aria-label="close sidebar"
      class="drawer-overlay"
    />
    <ul class="menu min-h-full w-80 bg-base-200 p-4 text-2xl font-semibold">
      {#each routes as route}
        <li>
          <a on:click={() => (checked = false)} href={route.link}
            >{route.text}</a
          >
        </li>
      {/each}
    </ul>
  </div>
</div>
