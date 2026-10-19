<script lang="ts">
  import * as m from "$paraglide/messages";
  import * as Card from "$lib/components/ui/card";
  import ImageIcon from "@lucide/svelte/icons/image";
  import type { AlbumSchema } from "./schema";

  let { album, class: clazz = "" }: { album: AlbumSchema; class?: string } =
    $props();
</script>

<a href={`/gallery/album/${album.slug}`} class={clazz}>
  <Card.Root
    class="group gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md"
  >
    <div class="bg-muted relative aspect-3/2 overflow-hidden">
      {#if album.coverURL}
        <img
          src={album.coverURL}
          alt={album.title}
          loading="lazy"
          class="h-full w-full object-cover"
        />
      {:else}
        <div
          class="text-muted-foreground flex h-full items-center justify-center"
        >
          <ImageIcon class="size-8" />
        </div>
      {/if}
      <div
        class="bg-background/70 absolute inset-0 flex items-center justify-center opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
      >
        <span class="font-medium">{m.gallery_show_pictures()}</span>
      </div>
    </div>
    <Card.Content class="p-4">
      <Card.Title class="truncate text-2xl">{album.title}</Card.Title>
      <div
        class="text-muted-foreground mt-2 flex items-baseline justify-between gap-2 text-sm"
      >
        <p>{album.date.split("T")[0]}</p>
        <p>
          {album.imageCount}
          {album.imageCount === 1 ? m.gallery_picture() : m.gallery_pictures()}
        </p>
      </div>
    </Card.Content>
  </Card.Root>
</a>
