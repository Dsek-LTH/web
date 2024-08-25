<script>
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import PersonCarouselItem from "./PersonCarouselItem.svelte";
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
      style={`height: calc(100dvh - ${headerAndFooterHeight}px)`}
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
          class="absolute inset-x-4 bottom-32 text-center font-nolla-stab text-5xl leading-snug md:text-8xl"
        >
          En Nollning<br />i Stormens Öga
        </span>
      </figure>
    </div>
    <section class="flex flex-col">
      <h3 class="page-title text-secondary">Hejsan N0llan</h3>
      <p class="nolla-prose">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. In interdum
        venenatis faucibus. Praesent dictum iaculis iaculis. Aliquam nulla
        magna, venenatis sit amet mauris sed, pharetra consectetur urna. Class
        aptent taciti sociosqu ad litora torquent per conubia nostra, per
        inceptos himenaeos. Phasellus non congue leo. Duis malesuada commodo
        arcu eu consectetur. Morbi aliquam rhoncus tellus ac tempus. Suspendisse
        blandit augue nec massa semper semper nec vitae erat.
      </p>
      <a href="#staben" class="btn-primary-dark btn self-center"
        >Läs om Staben</a
      >
    </section>
    <section>
      <h3 class="page-title font-nolla-stab !text-2xl text-secondary">
        Det var en gång...
      </h3>
      <p class="nolla-prose">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. In interdum
        venenatis faucibus. Praesent dictum iaculis iaculis. Aliquam nulla
        magna, venenatis sit amet mauris sed, pharetra consectetur urna. Class
        aptent taciti sociosqu ad litora torquent per conubia nostra, per
        inceptos himenaeos. Phasellus non congue leo. Duis malesuada commodo
        arcu eu consectetur. Morbi aliquam rhoncus tellus ac tempus. Suspendisse
        blandit augue nec massa semper semper nec vitae erat.
      </p>
    </section>

    <section class="!my-32 !mb-48 flex flex-col items-center" id="staben">
      <div class="carousel w-full scroll-smooth">
        <PersonCarouselItem stab name={`Øverphøs\nArux Tonitribus`} index={0} />
        <PersonCarouselItem stab name="ImRe Daemon" index={1} />
        <PersonCarouselItem stab name="Volto RefacTor" index={2} />
        <PersonCarouselItem stab name="Lostrego MutatI/O" index={3} />
        <PersonCarouselItem stab name="Macro Tempestas" index={4} />
        <PersonCarouselItem stab name="Celesta VentUX" index={5} />
      </div>
    </section>
  {/if}

  <section class="!my-32 !mb-48 flex flex-col items-center" id="peppers">
    <div class="carousel w-full scroll-smooth">
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
    <h3 class="page-title mb-4 text-secondary">Nollningspolicy</h3>
    <p class="nolla-prose">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. In interdum
      venenatis faucibus. Praesent dictum iaculis iaculis. Aliquam nulla magna,
      venenatis sit amet mauris sed, pharetra consectetur urna. Class aptent
      taciti sociosqu ad litora torquent per conubia nostra, per inceptos
      himenaeos. Phasellus non congue leo. Duis malesuada commodo arcu eu
      consectetur. Morbi aliquam rhoncus tellus ac tempus. Suspendisse blandit
      augue nec massa semper semper nec vitae erat.
    </p>
    {#if data.revealTheme}
      <!-- TODO: Link -->
      <a href="/" class="btn-primary-dark btn self-center"
        >Läs Nollekontraktet</a
      >
    {/if}
  </section>
</article>
