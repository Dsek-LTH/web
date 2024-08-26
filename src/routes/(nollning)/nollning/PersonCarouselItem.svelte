<script lang="ts">
  export let stab = false;
  export let name: string;
  export let body = "";
  export let imageUrl = "";
  export let index: number;
  export let max = stab ? 6 : 11;
  export let prefix = `${stab ? "stab" : "pepp"}slide`;
  export let font = stab
    ? "font-nolla-stab text-3xl tracking-widest"
    : "font-nolla-pepp tracking-wider text-xl";

  export let rounded = true;
  $: newLines = name.split("\n").length - 1;
</script>

<div
  id="{prefix}{index}"
  class="relative w-full scroll-mt-20 flex-col items-center max-md:carousel-item md:flex"
>
  <div class="mb-4 flex gap-1 md:hidden">
    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
    {#each new Array(max).fill(0) as _, i}
      <div
        class="size-2 rounded-full"
        class:bg-base-content={i === index}
        class:bg-base-200={i !== index}
      />
    {/each}
  </div>
  <figure
    class="relative mb-16 size-60 border-none"
    class:rounded-full={rounded}
    class:rounded-btn={!rounded}
  >
    <div
      class="absolute -inset-x-12 top-1/2 flex -translate-y-1/2 transform justify-between md:hidden"
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
    <img
      src={imageUrl}
      alt={name}
      class="h-full w-full object-cover"
      class:rounded-full={rounded}
      class:rounded-btn={!rounded}
    />
  </figure>
  <h3
    class="mb-4 text-center font-medium text-primary {font} rounded-btn bg-base-100 p-2"
    style="margin-top: -{newLines * 1.2}em"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html name.replaceAll("\n", "<br />")}
  </h3>
  <p class="nolla-prose rounded-btn bg-base-100 p-2 text-center">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html body.replaceAll("\n", "<br />")}
  </p>
  <slot />
</div>
