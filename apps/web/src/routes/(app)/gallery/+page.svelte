<script lang="ts">
  import { Card, CardContent } from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";
  import Plus from "@lucide/svelte/icons/plus";
  import ImageIcon from "@lucide/svelte/icons/image";

  let { data } = $props();
</script>

<SetPageTitle title={m.gallery()} />

<div class="mx-auto w-full max-w-5xl px-4 py-8">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold">{m.gallery()}</h1>
    <Button href="/gallery/upload" class="flex items-center gap-2">
      <Plus class="h-4 w-4" />
      {m.gallery_create_album()}
    </Button>
  </div>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
    {#each data.albums as { key: album, pictures } (album)}
      {@const cover = pictures?.[0]}
      <a href="/gallery/album/{album}">
        <Card class="overflow-hidden py-0">
          <div
            class="bg-muted-background flex aspect-video items-center justify-center"
          >
            {#if cover}
              <img
                src={cover.url}
                alt={album}
                class="h-full w-full object-cover"
              />
            {:else}
              <ImageIcon class="text-muted-foreground h-8 w-8" />
            {/if}
          </div>
          <CardContent class="pt-0 pb-4">
            <p class="truncate font-medium">{album}</p>
            <p class="text-muted-foreground text-sm">
              {pictures?.length ?? 0}
              {pictures?.length === 1
                ? m.gallery_picture()
                : m.gallery_pictures()}
            </p>
          </CardContent>
        </Card>
      </a>
    {/each}
  </div>
</div>
