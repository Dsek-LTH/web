<script lang="ts">
  import Play from "@lucide/svelte/icons/play";
  import { twMerge } from "tailwind-merge";
  import * as m from "$paraglide/messages";
  import YoutubeFrame from "./YoutubeFrame.svelte";
  import CommitteePlaceholder from "./images/CommitteePlaceholder.svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  import {
    getYoutubeEmbedUrl,
    getYoutubeThumbnailUrl,
    type YoutubeThumbnailQuality,
  } from "$lib/utils/youtube";

  type Committee = Pick<
    ExtendedPrismaModel<"Committee">,
    "shortName" | "symbolUrl" | "name"
  >;

  let {
    videoId,
    title,
    imageUrl,
    committee,
    class: klass,
  }: {
    videoId: string;
    /** Describes the video for the play button and the embedded player. */
    title: string;
    /** Cover image used when the video thumbnail is unavailable. */
    imageUrl?: string | null;
    committee?: Committee | null;
    class?: string;
  } = $props();

  let playing = $state(false);
  let posterQuality = $state<YoutubeThumbnailQuality>("maxresdefault");
  let posterFailed = $state(false);
  let imageFailed = $state(false);

  const embedUrl = $derived(getYoutubeEmbedUrl(videoId, true));

  function fallbackPoster() {
    if (posterQuality === "maxresdefault") {
      posterQuality = "hqdefault";
    } else {
      posterFailed = true;
    }
  }
</script>

<div
  class={twMerge(
    "bg-muted-background relative overflow-hidden rounded-md",
    klass,
  )}
>
  {#if playing}
    <YoutubeFrame src={embedUrl} {title} />
  {:else}
    <button
      type="button"
      class="group relative block size-full cursor-pointer"
      aria-label={m.news_play_video({ title })}
      onclick={() => (playing = true)}
    >
      <div class="absolute inset-0" aria-hidden="true">
        <CommitteePlaceholder
          committee={committee ?? null}
          class="absolute inset-0"
        />
      </div>
      {#if imageUrl && !imageFailed}
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          class="absolute inset-0 size-full object-cover"
          onerror={() => (imageFailed = true)}
        />
      {/if}
      {#if !posterFailed}
        <img
          src={getYoutubeThumbnailUrl(videoId, posterQuality)}
          alt=""
          loading="lazy"
          class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          onerror={fallbackPoster}
          onload={(event) => {
            // YouTube sometimes serves a 120x90 grey placeholder with HTTP 200.
            const image = event.currentTarget;
            if (!(image instanceof HTMLImageElement)) return;
            if (image.naturalWidth <= 120) fallbackPoster();
          }}
        />
      {/if}
      <span
        class="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/10"
      >
        <span
          class="flex size-14 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm"
        >
          <Play class="ml-1 size-6 fill-current" />
        </span>
      </span>
    </button>
  {/if}
</div>
