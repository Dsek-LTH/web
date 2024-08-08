<script lang="ts">
  import RegattaImage from "./regatta.jpg";
  import PeppTuesdayImage from "./pepptuesday.jpg";
  import NollningCircleImage from "./circle.jpeg";
  import * as m from "$paraglide/messages";

  const navItems = [
    { text: m.nolla_nav_nationer(), link: m.nolla_nation_link() },
    { text: m.nolla_nav_list(), link: "/nolla/packing" },
    { text: m.nolla_wordlist_header(), link: "/nolla/wordlist" },
  ];
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
<div class="mx-auto flex max-w-6xl flex-col gap-y-8 md:gap-y-16">
  <header class="flex w-full justify-end">
    <h1 class="nolla-page-title relative w-min text-right">
      {@html m.nolla_nollning_header()}
    </h1>
  </header>

  <div class=" flex flex-col justify-between gap-8 md:flex-row">
    <article
      class="neo-brutal-box grid place-items-center self-start bg-[#B1FFB4] text-lg md:max-w-[449px]"
    >
      <h1 class="font-bold">{@html m.nolla_nollning_what()}</h1>
      <p class="nolla-prose">
        {@html m.nolla_nollning_whatText()}
      </p>
    </article>

    <article
      class="neo-brutal-box grid place-items-center self-start bg-[#FFF38B] text-lg md:max-w-[407px] md:py-32"
    >
      <h1 class="font-bold">{@html m.nolla_nollning_firstDay()}</h1>
      <p class="nolla-prose">
        {@html m.nolla_nollning_firstDayText()}
      </p>
    </article>
  </div>

  <div class="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
    <img
      src={RegattaImage}
      alt="Students in boats at the yearly 'Regatta' competition"
      class="neo-brutal-image object-cover"
    />
    <img
      class="neo-brutal-image object-cover"
      src={PeppTuesdayImage}
      alt="Students on the 'pepp tuesday' event waiting to go in the jumping castle thingy"
    />
  </div>

  <article
    class="neo-brutal-box grid place-items-center self-start bg-[#ffc6eb] text-lg md:max-w-[712px]"
  >
    <h1 class="font-bold">{@html m.nolla_nollning_group()}</h1>
    <p class="nolla-prose">
      {@html m.nolla_nollning_groupText()}
    </p>
  </article>

  <img
    class="neo-brutal-image self-end object-cover lg:max-w-2xl"
    src={NollningCircleImage}
    alt="Students during the nollning standing in a circle and singing"
  />

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
