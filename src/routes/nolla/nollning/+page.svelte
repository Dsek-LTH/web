<script lang="ts">
  import * as m from "$paraglide/messages";

  const navItems = [
    { text: m.nolla_nav_nationer(), link: m.nolla_nation_link() },
    { text: m.nolla_nav_list(), link: "/nolla/list" },
  ];
</script>

<div class="mx-auto max-w-6xl">
  <header class="my-16">
    <h1 class="relative w-min font-nolla-mono text-8xl font-bold md:left-1/2">
      {m.nolla_nollning_header()}
    </h1>
  </header>

  <div class="mb-8 flex flex-col justify-between gap-8 md:flex-row">
    <article
      class="box-shadow-black-lg grid place-items-center self-start rounded-2xl bg-[#B1FFB4] px-10 py-16 text-lg md:max-w-[449px]"
    >
      <div>
        <h1 class="font-bold">{m.nolla_nollning_what()}</h1>
        <p>
          {m.nolla_nollning_whatText()}
        </p>
      </div>
    </article>

    <article
      class="box-shadow-black-lg grid place-items-center self-start rounded-2xl bg-[#FFF38B] px-10 py-16 text-lg md:max-w-[407px] md:py-32"
    >
      <div>
        <h1 class="font-bold">{m.nolla_nollning_firstDay()}</h1>
        <p>
          {m.nolla_nollning_firstDayText()}
        </p>
      </div>
    </article>
  </div>

  <article
    class="box-shadow-black-lg mb-8 grid place-items-center self-start rounded-2xl bg-[#ffc6eb] px-10 py-16 text-lg md:max-w-[712px]"
  >
    <div>
      <h1 class="font-bold">{m.nolla_nollning_group()}</h1>
      <p>
        {m.nolla_nollning_groupText()}
      </p>
    </div>
  </article>

  <article
    class="flex h-72 w-full items-center justify-center gap-24 rounded-3xl bg-[#FF77C0] md:my-32"
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
</div>
