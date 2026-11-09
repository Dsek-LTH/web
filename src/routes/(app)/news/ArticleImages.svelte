<script lang="ts">
  import * as m from "$paraglide/messages";
  import { isFileImage } from "$lib/files/utils";
  import ImagePlus from "@lucide/svelte/icons/image-plus";
  import Star from "@lucide/svelte/icons/star";
  import X from "@lucide/svelte/icons/x";

  let {
    imageUrls,
    coverIndex,
    onadd,
    onremove,
    oncover,
    id = "images",
    error,
  }: {
    /** Existing images first, then previews of new uploads: the same order the server uses. */
    imageUrls: string[];
    /** Index into `imageUrls`, or -1 when no image is the cover. */
    coverIndex: number;
    onadd: (files: File[]) => void;
    onremove: (index: number) => void;
    oncover: (index: number) => void;
    id?: string;
    error?: string;
  } = $props();

  let dragging = $state(false);

  const add = (files: FileList | null | undefined) => {
    const images = Array.from(files ?? []).filter(isFileImage);
    if (images.length > 0) onadd(images);
  };
</script>

<div class="flex flex-col gap-3">
  {#if imageUrls.length > 0}
    <ul class="m-0 grid list-none grid-cols-3 gap-2 sm:grid-cols-4 [&>li]:my-0">
      <!-- Keyed by position too: an article may list the same URL twice, and duplicate keys throw. -->
      {#each imageUrls as url, index (`${index}:${url}`)}
        {@const isCover = index === coverIndex}
        <li
          class="group bg-muted-background relative aspect-[3/2] overflow-hidden rounded-md ring-2 {isCover
            ? 'ring-primary'
            : 'ring-transparent'}"
        >
          <img src={url} alt="" class="size-full object-cover" />
          {#if isCover}
            <span
              class="bg-primary text-primary-foreground absolute bottom-1 left-1 rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium"
            >
              {m.news_images_cover()}
            </span>
          {:else}
            <button
              type="button"
              class="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] leading-4 font-medium text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
              onclick={() => oncover(index)}
            >
              <Star class="size-3" aria-hidden="true" />
              {m.news_images_makeCover()}
            </button>
          {/if}
          <button
            type="button"
            class="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90"
            aria-label={m.news_images_remove()}
            onclick={() => onremove(index)}
          >
            <X class="size-3.5" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <!-- The whole zone is the file input's label, so clicking anywhere opens the picker. -->
  <label
    for={id}
    class="border-border text-muted-foreground hover:bg-muted flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed px-4 py-6 text-center text-sm transition-colors {dragging
      ? 'bg-muted border-primary'
      : ''} {error ? 'border-destructive' : ''}"
    ondragover={(event) => {
      event.preventDefault();
      dragging = true;
    }}
    ondragleave={() => (dragging = false)}
    ondrop={(event) => {
      event.preventDefault();
      dragging = false;
      add(event.dataTransfer?.files);
    }}
  >
    <ImagePlus class="mb-1 size-5" aria-hidden="true" />
    <span class="text-foreground font-medium">{m.news_images_add()}</span>
    <span>{m.news_images_drop()}</span>
    <input
      {id}
      type="file"
      accept="image/*"
      multiple
      class="sr-only"
      onchange={(event) => {
        add(event.currentTarget.files);
        // Reset so picking the same file again after removing it still fires.
        event.currentTarget.value = "";
      }}
    />
  </label>
  {#if error}
    <p class="text-destructive text-xs font-semibold">{error}</p>
  {/if}
</div>
