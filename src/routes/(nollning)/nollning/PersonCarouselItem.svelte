<script lang="ts">
  export let stab = false;
  export let name: string;
  export let body = ""; /* TODO: Add bodies */
  export let imageUrl = ""; /* TODO: Add image urls */
  export let index: number;
  $: max = stab ? 6 : 11;
  $: prefix = `${stab ? "stab" : "pepp"}slide`;
  $: newLines = name.split("\n").length - 1;
</script>

<div
  id="{prefix}{index}"
  class="carousel-item relative w-full flex-col items-center"
>
  <div class="mb-4 flex gap-1">
    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
    {#each new Array(max).fill(0) as _, i}
      <div
        class="size-2 rounded-full"
        class:bg-base-content={i === index}
        class:bg-base-200={i !== index}
      />
    {/each}
  </div>
  <figure class="relative mb-16 size-60 rounded-full border-none bg-neutral">
    <div
      class="absolute -inset-x-12 top-1/2 flex -translate-y-1/2 transform justify-between"
    >
      {#if index > 0}
        <a href="#{prefix}{index - 1}" class=" p-6 px-4">❮</a>
      {:else}
        <div />
      {/if}
      {#if index < max - 1}
        <a href="#{prefix}{index + 1}" class="p-6 px-4">❯</a>
      {/if}
    </div>
    <img src={imageUrl} alt={name} class="h-full w-full object-cover" />
  </figure>
  <h3
    class="page-title mb-4 text-center text-primary"
    style="margin-top: -{newLines * 1.2}em"
    class:font-nolla-stab={stab}
    class:!text-3xl={stab}
    class:!tracking-widest={stab}
    class:font-nolla-pepp={!stab}
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html name.replace("\n", "<br />")}
  </h3>
  <p class="nolla-prose text-center">
    {body}
  </p>
</div>
