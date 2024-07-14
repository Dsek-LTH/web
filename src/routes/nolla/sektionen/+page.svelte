<script lang="ts">
  import DChipLogo from "./d-chip.webp";
  import * as m from "$paraglide/messages";
</script>

<header>
  <h1 class="mx-auto text-center font-nolla-mono text-8xl font-bold">
    {m.nolla_guild_header()}
  </h1>
  <h2
    class="mx-auto text-center text-[2.3rem] font-bold text-primary drop-shadow-sm"
  >
    {m.nolla_guild_tagline()}
  </h2>
</header>

<article class="flex flex-col items-stretch gap-16 py-16">
  <div class="flex items-stretch">
    <section class="neo-brutal-box bg-secondary">
      <h3 class="font-nolla-mono text-2xl font-semibold">
        {m.nolla_guild_title()}
      </h3>
      <p class="flex-1">
        {m.nolla_guild_description()}
      </p>
      <a class="neo-brutal-btn w-min rounded-box" href="/home">dsek.se</a>
    </section>
    <img src="#" alt="D-sektionen" class="flex-1" />
  </div>

  <section
    class="neo-brutal-box grid flex-1 grid-cols-5 grid-rows-2 place-items-stretch !p-0"
  >
    <div class="col-span-3 bg-primary">
      <div class="h-full w-full rounded-br-box bg-base-100 p-4">
        <img src="#" alt="D-sektionens styrelse" />
      </div>
    </div>
    <div class="col-span-2 rounded-t-box bg-primary px-10 pb-8 pt-16">
      <h3 class="font-nolla-mono text-2xl font-semibold">
        {m.nolla_guild_the_board()}
      </h3>
      <p>
        {m.nolla_guild_board_description()}
        <a href="/committees" class="link">{m.nolla_readMore()}</a>
      </p>
    </div>
    <ul
      class="col-span-5 grid grid-cols-3 gap-2 rounded-box rounded-tr-none bg-primary px-10 pb-16 pt-8 [&>li>b]:block"
    >
      <li>
        <b>{m.nolla_guild_board_president()}</b>
        {m.nolla_guild_board_president_description()}
      </li>
      <li>
        <b>{m.nolla_guild_board_vice_president()}</b>
        {m.nolla_guild_board_vice_president_description()}
      </li>
      <li>
        <b>{m.nolla_guild_board_treasurer()}</b>
        {m.nolla_guild_board_treasurer_description()}
      </li>
      <li>
        <b>{m.nolla_guild_board_study_president()}</b>
        {m.nolla_guild_board_study_president_description()}
      </li>
      <li>
        <b>{m.nolla_guild_board_information()}</b>
        {m.nolla_guild_board_information_description()}
      </li>
      <li>
        <b>{m.nolla_guild_board_cafe()}</b>
        {m.nolla_guild_board_cafe_description()}.
      </li>
      <li>
        <b>{m.nolla_guild_board_sex()}</b>
        {m.nolla_guild_board_sex_description()}
      </li>
      <li>
        <b>{m.nolla_guild_board_kallarm()}</b>
        {m.nolla_guild_board_kallarm_description()}
      </li>
      <li>
        <b>{m.nolla_guild_board_corporate_relations()}</b>
        {m.nolla_guild_board_corporate_relations_description()}
      </li>
      <li>
        <b>{m.nolla_guild_board_activities()}</b>
        {m.nolla_guild_board_activities_description()}
      </li>
    </ul>
  </section>

  <div class="flex items-stretch">
    <section class="neo-brutal-box bg-secondary">
      <img
        src={DChipLogo}
        alt="D-chips styrelse"
        class="h-auto max-h-16 w-auto max-w-full"
      />
      <p>
        {m.nolla_guild_dchip_description()}
      </p>

      <a
        class="neo-brutal-btn w-min whitespace-nowrap rounded-box"
        href="https://dchip.dsek.se"
      >
        {m.nolla_guild_dchip_link()}
      </a>
    </section>
    <figure class="flex-1">
      <img
        src="#"
        alt="D-chips styrelse"
        class="h-auto max-h-full w-auto max-w-full"
      />
    </figure>
  </div>
</article>
