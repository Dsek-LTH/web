<script lang="ts">
  import DsekLogo from "$lib/components/DsekLogo.svelte";
  import DownArrow from "./DownArrow.svelte";
  import * as m from "$paraglide/messages";

  const navItems = [
    { text: m.nolla_nav_wellbeing(), link: "/nolla/wellbeing" },
    { text: m.nolla_nav_boende(), link: "/nolla/boende" },
    { text: m.nolla_nav_nationer(), link: "https://www.studentlund.se/" },
    { text: m.nolla_nav_list(), link: "/nolla/packing" },
  ];
</script>

<header
  class="flex h-[calc(100vh-var(--navbar-size))] flex-col justify-between py-24"
>
  <div class="flex justify-between">
    <h1 class="font-nolla-mono text-8xl leading-[1.1]">
      <div>{m.nolla_start_welcome()}</div>
      <div>{m.nolla_start_to()}</div>
      <div class="font-bold">{m.nolla_start_dguild()}</div>
    </h1>

    <DsekLogo class="hidden size-80 lg:block" variant="full" />
  </div>

  <a class="flex w-full animate-bounce justify-center" href="#links">
    <DownArrow />
  </a>
</header>

<article
  id="links"
  class="mb-32 flex h-72 w-full items-center justify-center gap-24 rounded-3xl bg-secondary"
>
  {#each navItems as navItem (navItem.link)}
    <a
      href={navItem.link}
      class="rounded-xl border-2 border-black bg-primary p-5 text-xl font-semibold hover:bg-[#0D1B1E] hover:text-white"
    >
      {navItem.text}
    </a>
  {/each}
</article>
