<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";

  let { data } = $props();

  let selectedIndex = $state<number | null>(null);
  let lightboxOpen = $derived(selectedIndex !== null);

  function next() {
    if (selectedIndex === null) return;
    selectedIndex = (selectedIndex + 1) % data.pictures.length;
  }
  function prev() {
    if (selectedIndex === null) return;
    selectedIndex =
      (selectedIndex - 1 + data.pictures.length) % data.pictures.length;
  }
</script>

<SetPageTitle title={data.album} />

<div class="mx-auto w-full max-w-5xl px-4 py-8">
  <Button variant="ghost" href="/gallery" class="mb-6 flex items-center gap-2">
    <ArrowLeft class="h-4 w-4" />
    {m.gallery_back()}
  </Button>

  <div class="mb-6 flex flex-wrap items-center justify-between gap-2">
    <h1 class="text-3xl font-bold">{data.album}</h1>
    {#if data.metadata?.photographer || data.metadata?.editor}
      <div class="text-muted-foreground text-sm">
        {#if data.metadata.photographer}
          <p>{m.gallery_photographer()}: {data.metadata.photographer}</p>
        {/if}
        {#if data.metadata.editor}
          <p>{m.gallery_editor()}: {data.metadata.editor}</p>
        {/if}
      </div>
    {/if}
  </div>

  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
    {#each data.pictures as picture, index (picture.id)}
      {#if picture.thumbnailUrl}
        <button
          type="button"
          class="bg-muted-background aspect-square overflow-hidden rounded-md"
          onclick={() => (selectedIndex = index)}
        >
          <img
            src={picture.thumbnailUrl}
            alt={picture.name}
            class="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </button>
      {/if}
    {/each}
  </div>
</div>

<Dialog.Root
  open={lightboxOpen}
  onOpenChange={(open) => {
    if (!open) selectedIndex = null;
  }}
>
  <Dialog.Content class="flex max-w-3xl items-center justify-center border-none bg-transparent p-0 shadow-none">
    {#if selectedIndex !== null}
      <div class="relative flex w-full items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          class="absolute left-0 text-white hover:bg-white/10 hover:text-white"
          aria-label={m.gallery_previous()}
          onclick={prev}
        >
          <ChevronLeft class="h-6 w-6" />
        </Button>
        <img
          src={data.pictures[selectedIndex]!.thumbnailUrl}
          alt={data.pictures[selectedIndex]!.name}
          class="max-h-[80vh] max-w-full object-contain"
        />
        <Button
          variant="ghost"
          size="icon"
          class="absolute right-0 text-white hover:bg-white/10 hover:text-white"
          aria-label={m.gallery_next()}
          onclick={next}
        >
          <ChevronRight class="h-6 w-6" />
        </Button>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
