<script lang="ts">
  import DsekLogo from "$lib/components/DsekLogo.svelte";
  import DownArrow from "./DownArrow.svelte";
  import * as m from "$paraglide/messages";

  const navItems = [
    { text: m.nolla_nav_wellbeing(), link: "/nolla/wellbeing" },
    { text: m.nolla_nav_boende(), link: m.nolla_accomodation_link() },
    { text: m.nolla_nav_nationer(), link: m.nolla_nation_link() },
    { text: m.nolla_nav_list(), link: "/nolla/packing" },
  ];
</script>

<header
  class="flex h-[calc(100vh-var(--navbar-size))] flex-col justify-between pb-12 md:py-24"
>
  <div class="flex flex-col items-center justify-between gap-2 md:flex-row">
    <h1
      class="text-left font-nolla-mono text-4xl leading-[1.1] sm:text-6xl lg:text-8xl"
    >
      <div>{m.nolla_start_welcome()}</div>
      <div>{m.nolla_start_to()}</div>
      <div class="font-bold">{m.nolla_start_dguild()}</div>
    </h1>

    <DsekLogo
      class="mt-8 block size-60 sm:size-80 md:mt-0 md:size-60 lg:size-80"
      variant="full"
    />
  </div>

  <a class="flex w-full animate-bounce justify-center" href="#links">
    <DownArrow />
  </a>
</header>

<article
  id="links"
  class="neo-brutal-box flex flex-col items-stretch justify-center gap-8 bg-secondary lg:h-72 lg:w-full lg:flex-row lg:items-center lg:gap-24"
>
  {#each navItems as navItem (navItem.link)}
    <a href={navItem.link} class="neo-brutal-btn-flat">
      {navItem.text}
    </a>
  {/each}
</article>
