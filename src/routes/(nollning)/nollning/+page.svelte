<script>
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import PostRevealImage from "$lib/components/postReveal/PostRevealImage.svelte";
</script>

<SetPageTitle title="Nollning" />

<article class="space-y-16">
  <PostRevealImage src="https://www.dsek.se/hero-image.webp" alt="Hero image" />

  <section class="flex flex-col">
    <h3 class="page-title text-secondary">Hejsan N0llan</h3>
    <p class="nolla-prose">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. In interdum
      venenatis faucibus. Praesent dictum iaculis iaculis. Aliquam nulla magna,
      venenatis sit amet mauris sed, pharetra consectetur urna. Class aptent
      taciti sociosqu ad litora torquent per conubia nostra, per inceptos
      himenaeos. Phasellus non congue leo. Duis malesuada commodo arcu eu
      consectetur. Morbi aliquam rhoncus tellus ac tempus. Suspendisse blandit
      augue nec massa semper semper nec vitae erat.
    </p>
    <a href="wikia" class="btn-primary-dark btn self-center">Läs om Staben</a>
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
    <a href="wikia" class="btn-primary-dark btn self-center"
      >Läs Nollekontraktet</a
    >
  </section>
</article>
