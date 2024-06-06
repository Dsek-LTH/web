<script lang="ts">
  const navItems = [
    { text: "Nationer", link: "/nolla/nationer" },
    { text: "Packlista", link: "/nolla/list" },
  ];
</script>

<div class="mx-auto max-w-6xl">
  <header class="my-16">
    <h1 class="relative w-min font-nolla-mono text-8xl font-bold md:left-1/2">
      Vad är en nollning?
    </h1>
  </header>

  <div class="mb-8 flex flex-col justify-between gap-8 md:flex-row">
    <article
      class="box-shadow-black-lg grid place-items-center self-start rounded-2xl bg-[#B1FFB4] px-10 py-16 text-lg md:max-w-[449px]"
    >
      <div>
        <h1 class="font-bold">Vad är nollningen?</h1>
        <p>
          Nollningens veckor är fyllda med en massa roliga och blandade
          aktiviteter där vi hoppas att det finns någonting för alla.
          Nollningens syfte är att ge möjlighet för nya studenter att lära känna
          andra studenter, hitta en gemenskap och upptäcka vad Lunds studentliv
          har att erbjuda.
        </p>
      </div>
    </article>

    <article
      class="box-shadow-black-lg grid place-items-center self-start rounded-2xl bg-[#FFF38B] px-10 py-16 text-lg md:max-w-[407px] md:py-32"
    >
      <div>
        <h1 class="font-bold">Vad händer första dagen?</h1>
        <p>
          Första dagen kommer du få din phaddergrupp och tillsammans kommer ni
          upptäcka campus och introduceras till D-sektionen. Efter
          rundvandringen bjuder phaddrarna på middag och trevligt häng.
        </p>
      </div>
    </article>
  </div>

  <article
    class="box-shadow-black-lg mb-8 grid place-items-center self-start rounded-2xl bg-[#ffc6eb] px-10 py-16 text-lg md:max-w-[712px]"
  >
    <div>
      <h1 class="font-bold">Phaddergruppen</h1>
      <p>
        Du kommer delas in i en phaddergrupp med andra nya studenter på
        D-sektionen. I gruppen har ni ett gäng phaddrar av blandade årskurser
        som kommer hjälpa och stötta dig och kommer kunna svara på alla möjliga
        sorters frågor. Phaddergruppen kommer vara en trygg punkt under hela
        nollningen, men det kommer självklart finnas massa möjligheter att lära
        känna fler nya studenter, både på D-sektionen och från andra sektioner.
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
