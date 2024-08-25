<script>
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import MembersList from "$lib/components/socials/MembersList.svelte";
  import PersonCarouselItem from "./PersonCarouselItem.svelte";
  import * as m from "$paraglide/messages";

  export let data;
  $: topInsets = ($page.data.appInfo?.insets?.top ?? 0) + 8;
  $: bottomInsets = $page.data.appInfo?.insets?.bottom ?? 0;
  $: headerAndFooterHeight = 128 + topInsets + bottomInsets;
</script>

<SetPageTitle title="Nollning" />

<article class="space-y-16">
  {#if data.revealTheme}
    <div
      class="-mx-6 -my-6"
      style={`height: calc(100dvh - ${data.isApp ? headerAndFooterHeight : 0}px)`}
    >
      <figure
        class="relative h-full w-full overflow-hidden border-none bg-neutral"
      >
        <!-- todo: change image (also have two vers for landscape/profile) -->
        <img
          src="https://www.dsek.se/hero-image.webp"
          alt="Hero"
          class="h-full w-full object-cover"
        />
        <span
          class="absolute left-1/2 top-1/2 w-max max-w-screen-md -translate-x-1/2 -translate-y-1/2 transform px-4 text-center font-nolla-stab text-5xl leading-snug md:text-8xl"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html m.nollning_title()}
        </span>
      </figure>
    </div>
  {/if}
  <!-- limit width and center -->
  <div class="mx-auto max-w-screen-md">
    {#if data.revealTheme}
      <section class="flex flex-col">
        <h3 class="page-title text-secondary">
          {m.nollning_landing_hello_title()}
        </h3>
        <p class="nolla-prose">
          {m.nollning_landing_hello_body()}
        </p>
        <a href="#staben" class="btn-primary-dark btn self-center"
          >{m.nollning_landing_view_staben()}</a
        >
      </section>
      <section>
        <h3 class="page-title font-nolla-stab !text-2xl text-secondary">
          {m.nollning_landing_lore_title()}
        </h3>
        <p class="nolla-prose">
          {m.nollning_landing_lore_body()}
        </p>
      </section>

      <section class="!my-32 !mb-48 flex flex-col items-center" id="staben">
        <div
          class="w-full scroll-smooth max-md:carousel md:grid md:grid-cols-2 md:gap-4 lg:w-[calc(100%+8rem)] lg:grid-cols-3"
        >
          <PersonCarouselItem
            stab
            name={`Øverphøs\nArux Tonitribus`}
            index={0}
          />
          <PersonCarouselItem stab name="ImRe Daemon" index={1} />
          <PersonCarouselItem stab name="Volto RefacTor" index={2} />
          <PersonCarouselItem stab name="Lostrego MutatI/O" index={3} />
          <PersonCarouselItem stab name="Macro Tempestas" index={4} />
          <PersonCarouselItem stab name="Celesta VentUX" index={5} />
        </div>
      </section>
    {/if}

    <section class="!my-32 !mb-48 flex flex-col items-center" id="peppers">
      <div
        class="w-full scroll-smooth max-md:carousel md:grid md:grid-cols-2 md:gap-4 lg:w-[calc(100%+8rem)] lg:grid-cols-3"
      >
        <PersonCarouselItem name="Alexander" index={0} />
        <PersonCarouselItem name="Thyra" index={1} />
        <PersonCarouselItem name="Axel" index={2} />
        <PersonCarouselItem name="Klara" index={3} />
        <PersonCarouselItem name="Casper" index={4} />
        <PersonCarouselItem name="Wilma" index={5} />
        <PersonCarouselItem name="Emil" index={6} />
        <PersonCarouselItem name="Linn" index={7} />
        <PersonCarouselItem name="Gustaf" index={8} />
        <PersonCarouselItem name="Lola" index={9} />
        <PersonCarouselItem name="Jacobi" index={10} />
      </div>
    </section>

    <section class="flex flex-col">
      <h3 class="page-title mb-4 text-secondary">
        {m.nollning_landing_policy_header()}
      </h3>
      <p class="nolla-prose">
        {m.nollning_landing_policy_subtitle()}
      </p>
      <ul class="list-disc leading-relaxed">
        <li>{m.nollning_landing_policy_lines_1()}</li>
        <li>{m.nollning_landing_policy_lines_2()}</li>
        <li>{m.nollning_landing_policy_lines_3()}</li>
        <li>
          {m.nollning_landing_policy_lines_4()}
        </li>
      </ul>
      {#if data.revealTheme}
        <p class="nolla-prose">
          {m.nollning_landing_policy_readMore()}
        </p>
        <!-- TODO: Link -->
        <a href="/" class="btn-primary-dark btn self-center"
          >{m.nollning_landing_policy_read()}</a
        >
      {/if}
    </section>

    <!-- TODO: Phaddergrupper -->
    <section class="mt-16 flex flex-col items-center" id="peppers">
      <div
        class="w-full scroll-smooth max-md:carousel md:grid md:grid-cols-2 md:gap-4 lg:w-[calc(100%+8rem)] lg:grid-cols-3"
      >
        {#each data.phadderGroups as group, index}
          <PersonCarouselItem
            name={group.name}
            body={group.description ?? ""}
            imageUrl={group.imageUrl ?? ""}
            {index}
            max={data.phadderGroups.length}
            prefix="groupslide"
            font="text-2xl font-medium"
          >
            <div class="mt-2 flex justify-center gap-2">
              <MembersList class="btn btn-outline btn-sm" members={group.nollor}
                >{m.nollor()}</MembersList
              >
              <MembersList
                class="btn btn-outline btn-sm"
                members={group.phaddrar.map((p) => p.member)}
                >{m.phaddrar()}</MembersList
              >
            </div></PersonCarouselItem
          >
        {/each}
      </div>
    </section>
  </div>
</article>
