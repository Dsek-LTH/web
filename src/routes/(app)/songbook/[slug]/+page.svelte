<script lang="ts">
  import { Badge } from "$lib/components/ui/badge/index.js";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Pen from "@lucide/svelte/icons/pen";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import * as m from "$paraglide/messages.js";
  import apiNames from "$lib/utils/apiNames";
  import { mayWatchVideos } from "../helpers";
  import { Separator } from "$lib/components/ui/separator/index.js";

  let { data } = $props();
  let song = $derived(data.song);

  const canUpdate = $derived(
    data.user?.policies?.includes(apiNames.SONG.UPDATE),
  );
  const canWatchVideo = $derived(song.video && mayWatchVideos(data.user));

  function getYoutubeEmbedUrl(url: string): string | null {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match ? match[2] : null;
    return videoId && videoId.length === 11
      ? `https://www.youtube.com/embed/${videoId}`
      : null;
  }

  const youtubeEmbedUrl = $derived(
    song.video ? getYoutubeEmbedUrl(song.video) : null,
  );
</script>

<div class="mx-auto max-w-3xl px-4 py-8">
  <div class="mb-6 flex items-center justify-between">
    <Button variant="ghost" href="/songbook" class="flex items-center gap-2">
      <ArrowLeft class="h-4 w-4" />
      {m.back()}
    </Button>

    {#if canUpdate}
      <Button href="/songbook/{song.slug}/edit" class="flex items-center gap-2">
        <Pen class="h-4 w-4" />
        {m.songbook_edit()}
      </Button>
    {/if}
  </div>

  {#if song.deletedAt}
    <div
      class="bg-destructive/10 text-destructive border-destructive/20 mb-6 flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h3 class="text-lg font-bold">{m.songbook_deleted()}</h3>
        <p class="text-sm opacity-90">{m.songbook_deletedExplanation()}</p>
      </div>
      {#if data.user?.policies?.includes(apiNames.SONG.DELETE)}
        <form method="POST" action="/songbook/{song.slug}/edit?/restore">
          <input type="hidden" name="id" value={song.id} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            class="flex items-center gap-2"
          >
            <RotateCcw class="h-4 w-4" />
            {m.songbook_restoreFromGarbageCan()}
          </Button>
        </form>
      {/if}
    </div>
  {/if}

  <Card class="border-border shadow-xl">
    <CardHeader class="border-border border-b-[1px] pb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <CardTitle class="text-4xl font-bold tracking-tight"
            >{song.title}</CardTitle
          >
          {#if song.melody}
            <CardDescription class="mt-2 text-lg">
              {m.songbook_melody()}:
              <span class="text-foreground font-medium">{song.melody}</span>
            </CardDescription>
          {/if}
        </div>
        {#if song.category}
          <Badge variant="outline" class="shrink-0 px-3 py-1 text-base">
            {song.category}
          </Badge>
        {/if}
      </div>
    </CardHeader>
    <CardContent class="pt-8">
      <div
        class="text-foreground/90 font-serif text-lg leading-loose tracking-wide whitespace-pre-wrap"
      >
        {song.lyrics}
      </div>

      {#if canWatchVideo && song.video}
        <Separator class="my-8" />
        <div class="flex flex-col gap-4">
          <h3 class="text-xl font-bold tracking-tight">Video Performance</h3>
          <div
            class="border-border overflow-hidden rounded-lg border shadow-md"
          >
            {#if youtubeEmbedUrl}
              <div class="aspect-video w-full">
                <iframe
                  title="Youtube Video Player"
                  src={youtubeEmbedUrl}
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  class="h-full w-full"
                ></iframe>
              </div>
            {:else}
              <video
                src={song.video}
                controls
                preload="metadata"
                class="aspect-video w-full bg-black"
              >
                <track kind="captions" />
              </video>
            {/if}
          </div>
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
