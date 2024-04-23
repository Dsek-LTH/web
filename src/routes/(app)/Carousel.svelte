<script>
  import emblaCarouselSvelte from "embla-carousel-svelte";

  const images = ["./hero-image.jpg", "./hero-image.jpg", "./hero-image.jpg"];

  /**
     * @type {{
         scrollNext(): unknown; scrollPrev: () => any; 
}}
     */
  let embla;
</script>

<div class="flex items-center justify-center p-2">
  <button class="btn btn-circle z-10 -mr-6" on:click={() => embla.scrollPrev()}>
    <span class="i-mdi-arrow-left size-6" />
  </button>
  <div
    class="embla mb-4 w-full max-w-xl overflow-hidden rounded-lg"
    use:emblaCarouselSvelte={{ options: { loop: true }, plugins: [] }}
    on:emblaInit={(/** @type {{ detail: any; }} */ event) =>
      (embla = event.detail)}
  >
    <div class="embla__container">
      {#each images as image}
        <div class="embla__slide">
          <img src={image} alt="" class="h-full object-fill" />
        </div>
      {/each}
    </div>
  </div>
  <button class="btn btn-circle z-10 -ml-6" on:click={() => embla.scrollNext()}>
    <span class="i-mdi-arrow-right size-6" />
  </button>
</div>

<style>
  .embla {
    overflow: hidden;
  }
  .embla__container {
    display: flex;
  }
  .embla__slide {
    flex: 0 0 100%;
    min-width: 0;
  }
</style>
