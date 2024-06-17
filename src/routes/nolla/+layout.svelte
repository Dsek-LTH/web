<script lang="ts">
  import { languageTag } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { i18n } from "$lib/utils/i18n";
  import { invalidateAll } from "$app/navigation";
  import * as m from "$paraglide/messages";
  import "./styles.css";
</script>

<div
  data-theme="nollningPreReveal"
  class="flex flex-1 flex-col font-nolla-sans"
>
  <nav
    class="container mx-auto flex h-[var(--navbar-size)] items-center justify-between py-10"
  >
    <div
      class="flex gap-24 text-2xl font-semibold *:bg-gradient-to-r *:from-primary *:to-primary *:bg-[length:0_2px] *:bg-bottom *:bg-no-repeat *:transition-all"
    >
      <a href="/nolla" class="hover:bg-[length:100%_2px]">
        {m.nolla_nav_start()}
      </a>
      <a href="/nolla/nollning" class="hover:bg-[length:100%_2px]">
        {m.nolla_nav_nollning()}
      </a>
      <a href="/nolla/sektionen" class="hover:bg-[length:100%_2px]">
        {m.nolla_nav_sektionen()}
      </a>
      <a href="/nolla/todo" class="hover:bg-[length:100%_2px]">
        {m.nolla_nav_todo()}
      </a>
    </div>

    <div class="flex items-center gap-4 text-2xl">
      <a
        class="box-shadow-black translate hover:box-shadow-black-lg flex items-center
        rounded-xl border-2 border-black bg-primary p-4 font-semibold
        transition hover:-translate-x-1 hover:-translate-y-1 active:translate-x-1
        active:translate-y-1 active:shadow-none"
        href={i18n.route($page.url.pathname)}
        hreflang={languageTag() === "sv" ? "en" : "sv"}
        on:click={() => invalidateAll()}
      >
        {#if languageTag() === "sv"}
          <span class="i-flag-gb-4x3" />
        {:else}
          <span class="i-flag-se-4x3" />
        {/if}
      </a>

      <a
        href="/"
        class="box-shadow-black translate hover:box-shadow-black-lg flex items-center
             rounded-xl border-2 border-black bg-primary p-4 font-semibold
             transition hover:-translate-x-1 hover:-translate-y-1 active:translate-x-1
             active:translate-y-1 active:shadow-none"
      >
        dsek.se
        <span class="i-mdi-arrow-right" />
      </a>
    </div>
  </nav>

  <div class="container mx-auto flex-1">
    <slot />
  </div>
</div>
