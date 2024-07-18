<script lang="ts">
  import * as m from "$paraglide/messages";

  const navItems = [
    { text: m.nolla_nav_nationer(), link: m.nolla_nation_link() },
    { text: m.nolla_nav_list(), link: "/nolla/packing" },
    { text: m.nolla_wordlist_header(), link: "/nolla/wordlist" },
  ];
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
<div class="mx-auto max-w-6xl">
  <header class="flex w-full justify-end">
    <h1 class="nolla-page-title relative w-min text-right">
      {@html m.nolla_nollning_header()}
    </h1>
  </header>

  <div class="mb-8 flex flex-col justify-between gap-8 md:flex-row">
    <article
      class="neo-brutal-box grid place-items-center self-start bg-[#B1FFB4] text-lg md:max-w-[449px]"
    >
      <div>
        <h1 class="font-bold">{@html m.nolla_nollning_what()}</h1>
        <p>
          {@html m.nolla_nollning_whatText()}
        </p>
      </div>
    </article>

    <article
      class="neo-brutal-box grid place-items-center self-start bg-[#FFF38B] text-lg md:max-w-[407px] md:py-32"
    >
      <div>
        <h1 class="font-bold">{@html m.nolla_nollning_firstDay()}</h1>
        <p>
          {@html m.nolla_nollning_firstDayText()}
        </p>
      </div>
    </article>
  </div>

  <article
    class="neo-brutal-box mb-8 grid place-items-center self-start bg-[#ffc6eb] text-lg md:max-w-[712px]"
  >
    <div>
      <h1 class="font-bold">{@html m.nolla_nollning_group()}</h1>
      <p>
        {@html m.nolla_nollning_groupText()}
      </p>
    </div>
  </article>

  <article
    class="neo-brutal-box flex flex-col items-stretch justify-center gap-8 bg-[#FF77C0] lg:h-72 lg:w-full lg:flex-row lg:items-center lg:gap-24"
  >
    {#each navItems as navItem (navItem.link)}
      <a href={navItem.link} class="neo-brutal-btn-flat">
        {navItem.text}
      </a>
    {/each}
  </article>
</div>
