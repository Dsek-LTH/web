<script lang="ts">
  import { getFileUrl } from "$lib/files/client";

  export let images: string[] = [];

  let carouselRef: HTMLDivElement;

  function carouselLeft(): void {
    const carouselEl = carouselRef;
    if (!carouselEl) return;
    const x =
      carouselEl.scrollLeft <= 1 // should be == 0, but we'll account for floating point errors
        ? carouselEl.clientWidth * carouselEl.childElementCount // loop
        : carouselEl.scrollLeft - carouselEl.clientWidth; // step left
    carouselEl.scroll(x, 0);
  }

  function carouselRight(): void {
    const carouselEl = carouselRef;
    if (!carouselEl) return;
    const x =
      carouselEl.scrollLeft + 1 >=
      carouselEl.scrollWidth - carouselEl.clientWidth
        ? 0 // loop
        : carouselEl.scrollLeft + carouselEl.clientWidth; // step right
    carouselEl.scroll(x, 0);
  }
</script>

{#if images.length > 0}
  <div class="relative">
    <div class="carousel" bind:this={carouselRef}>
      {#each images as image, i}
        <div id="slide{i}" class="carousel-item relative w-full">
          <figure>
            <img src={getFileUrl(image)} alt={i.toString()} loading="lazy" />
          </figure>
        </div>
      {/each}
    </div>
    <div class="absolute bottom-5 w-full text-center">
      <button class="btn btn-circle" on:click={carouselLeft}>
        <span class="i-mdi-arrow-left" />
      </button>
      <button class="btn btn-circle" on:click={carouselRight}>
        <span class="i-mdi-arrow-right" />
      </button>
    </div>
  </div>
{/if}
