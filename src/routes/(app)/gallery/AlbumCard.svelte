<script lang="ts">
  import { cn } from "$lib/utils";
  import * as m from "$paraglide/messages";
  import type { AlbumSchema } from "./schema";
  let { album, class: clazz }: { album: AlbumSchema; class: string } = $props();
</script>

<a href={"./gallery/album/" + album.slug}
  ><div
    class={cn(
      "bg-base-300 bg-muted-background container rounded-md border-[1px] shadow-sm",
      clazz,
    )}
  >
    <figure class="group relative aspect-3/2 overflow-hidden rounded-t-md">
      <div
        class="bg-base-300 hover:bg-opacity-70 absolute inset-0 flex flex-col items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 hover:opacity-100 md:opacity-0"
      >
        <span class="link text-neutral-content text-lg hover:opacity-100"
          >{m.gallery_show_pictures()}</span
        >
      </div>
      <div
        style:background-image={"url(" + album.coverURL + ")"}
        class="absolute inset-0 z-0 bg-contain bg-center bg-no-repeat"
      ></div>
    </figure>
    <div class="p-4">
      <h2 class="text-2xl">{album.title}</h2>
      <div class="space-between flex flex-row items-baseline gap-2">
        <p>{album.date.split("T")[0]}</p>
        <p class="text-right">
          {album.imageCount}
          {album.imageCount > 1 ? m.gallery_pictures() : m.gallery_picture()}
        </p>
      </div>
    </div>
  </div>
</a>
