<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { cn } from "$lib/utils";

  let { images, class: className }: { images: string[]; class?: string } =
    $props();
</script>

{#if images.length > 0}
  <!-- Square thumbnails in a grid; click opens the full image. -->
  <ul
    data-sveltekit-preload-data="off"
    class={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}
  >
    {#each images as image, index (`${index}:${image}`)}
      <li>
        <Dialog.Root>
          <Dialog.Trigger
            class="bg-muted-background focus-visible:ring-ring block aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:outline-none"
          >
            <img
              class="size-full object-cover transition-transform duration-300 hover:scale-105"
              src={image}
              alt=""
              loading="lazy"
            />
          </Dialog.Trigger>
          <Dialog.Content class="p-2 sm:max-w-3xl">
            <Dialog.Title class="sr-only">{image}</Dialog.Title>
            <img
              class="max-h-[80vh] w-full rounded-md object-contain"
              src={image}
              alt=""
            />
          </Dialog.Content>
        </Dialog.Root>
      </li>
    {/each}
  </ul>
{/if}
