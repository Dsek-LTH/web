<script lang="ts">
  import * as Command from "$lib/components/ui/command/index.js";
  import type { SongSearchReturnAttributes } from "$lib/search/searchTypes";
  import Music2 from "@lucide/svelte/icons/music-2";
  const { data }: { data: SongSearchReturnAttributes } = $props();
</script>

<Command.LinkItem
  class="flex flex-row justify-between"
  href={`/songs/${data.slug}`}
  data-search-result
>
  <div class="flex flex-row items-center gap-2">
    <Music2 />
    <div class="flex flex-col">
      <span class="font-medium">{data.title}</span>
      <span class="text-muted-foreground line-clamp-1">
        {data.melody}
      </span>
    </div>
  </div>
</Command.LinkItem>
