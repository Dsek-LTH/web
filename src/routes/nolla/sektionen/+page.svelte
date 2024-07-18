<script lang="ts">
  import DChipLogo from "./d-chip.webp";
  import * as m from "$paraglide/messages";
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
<header>
  <h1 class="mx-auto text-center font-nolla-mono text-8xl font-bold">
    {@html m.nolla_guild_header()}
  </h1>
  <h2
    class="mx-auto text-center text-[2.3rem] font-bold text-primary drop-shadow-sm"
  >
    {@html m.nolla_guild_tagline()}
  </h2>
</header>

<article class="flex flex-col items-stretch gap-16 py-16">
  <div class="flex items-stretch gap-4">
    <section class="neo-brutal-box bg-secondary">
      <h3 class="font-nolla-mono text-2xl font-semibold">
        {@html m.nolla_guild_title()}
      </h3>
      <p class="flex-1">
        {@html m.nolla_guild_description()}
      </p>
      <a class="neo-brutal-btn w-min" href="/home"
        >dsek.se <span class="i-mdi-arrow-right ml-2 h-8 w-8" /></a
      >
    </section>
    <img
      src="https://www.afbostader.se/globalassets/bostadsomraden/pireus/pf_bsflb.jpg"
      alt="D-sektionen"
      class="neo-brutal-image w-0 flex-grow object-cover"
    />
  </div>

  <section
    class="box-shadow-black-lg grid flex-1 grid-cols-2 grid-rows-2 place-items-stretch rounded-2xl !p-0"
  >
    <div class="relative bg-primary">
      <div class="h-full w-full rounded-br-2xl bg-base-100 pb-8 pr-8">
        <img
          src="https://cdn.discordapp.com/attachments/1222270008701489348/1262081842996052098/IMG_6021.jpg?ex=66954ccf&is=6693fb4f&hm=2fac80ab8d317ef4f683813dcf96812d1a4117b2bdfc88206355e6fe075e70b3&"
          alt="D-sektionens styrelse"
          class="neo-brutal-image"
        />
      </div>
      <div
        class="absolute -bottom-1 -right-1 left-3 top-4 rounded-br-2xl border-b-4 border-r-4 border-black"
      />
    </div>
    <div
      style="border-start-width: 10px;"
      class="relative rounded-t-box border-4 border-b-0 border-l-0 border-black bg-primary px-10 pb-8 pt-16"
    >
      <div
        class="neo-brutal-border absolute left-0 right-0 top-0 h-4 border-b-0"
      />
      <h3 class="font-nolla-mono text-2xl font-semibold">
        {@html m.nolla_guild_the_board()}
      </h3>
      <p>
        {@html m.nolla_guild_board_description()}
        <a href="/committees" class="link">{@html m.nolla_readMore()}</a>
      </p>
    </div>
    <ul
      class="col-span-2 col-start-1 row-start-2 grid grid-cols-3 gap-2 rounded-2xl rounded-tr-none border-4 border-t-0 border-black bg-primary px-10 pb-16 pt-8 [&>li>b]:block"
    >
      <li>
        <b>{@html m.nolla_guild_board_president()}</b>
        {@html m.nolla_guild_board_president_description()}
      </li>
      <li>
        <b>{@html m.nolla_guild_board_vice_president()}</b>
        {@html m.nolla_guild_board_vice_president_description()}
      </li>
      <li>
        <b>{@html m.nolla_guild_board_treasurer()}</b>
        {@html m.nolla_guild_board_treasurer_description()}
      </li>
      <li>
        <b>{@html m.nolla_guild_board_study_president()}</b>
        {@html m.nolla_guild_board_study_president_description()}
      </li>
      <li>
        <b>{@html m.nolla_guild_board_information()}</b>
        {@html m.nolla_guild_board_information_description()}
      </li>
      <li>
        <b>{@html m.nolla_guild_board_cafe()}</b>
        {@html m.nolla_guild_board_cafe_description()}.
      </li>
      <li>
        <b>{@html m.nolla_guild_board_sex()}</b>
        {@html m.nolla_guild_board_sex_description()}
      </li>
      <li>
        <b>{@html m.nolla_guild_board_kallarm()}</b>
        {@html m.nolla_guild_board_kallarm_description()}
      </li>
      <li>
        <b>{@html m.nolla_guild_board_corporate_relations()}</b>
        {@html m.nolla_guild_board_corporate_relations_description()}
      </li>
      <li>
        <b>{@html m.nolla_guild_board_activities()}</b>
        {@html m.nolla_guild_board_activities_description()}
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
        {@html m.nolla_guild_dchip_description()}
      </p>

      <a
        class="neo-brutal-btn w-min whitespace-nowrap"
        href="https://dchip.dsek.se"
      >
        {@html m.nolla_guild_dchip_link()}
      </a>
    </section>
    <figure class="flex-1">
      <img
        src="https://www.afbostader.se/globalassets/bostadsomraden/pireus/pf_bsflb.jpg"
        alt="D-chips styrelse"
        class="h-auto max-h-full w-auto max-w-full"
      />
    </figure>
  </div>
</article>
